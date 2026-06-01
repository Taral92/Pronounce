from fastapi import APIRouter, Request, HTTPException, Header, Depends, Body
from app.middleware.auth import get_current_user
from app.services.db import db
from app.config import settings
from datetime import datetime, timezone
import stripe

router = APIRouter(tags=["stripe"])
stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(...)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    obj = event["data"]["object"]

    if event["type"] == "checkout.session.completed":
        clerk_id = obj.get("client_reference_id")
        customer = obj.get("customer")
        amount = (obj.get("amount_total") or 0) / 100
        plan_type = "annual" if amount > 10 else "monthly"
        if clerk_id and customer:
            db.table("users").update({"stripe_customer_id": customer, "tier": "pro", "ref_converted": True}).eq("id", clerk_id).execute()
            _record_commission(clerk_id, event["id"], amount, plan_type)

    elif event["type"] in ("customer.subscription.updated", "customer.subscription.created"):
        status = obj.get("status")
        db.table("users").update({"tier": "pro" if status == "active" else "free"}).eq("stripe_customer_id", obj["customer"]).execute()

    elif event["type"] in ("customer.subscription.deleted", "customer.subscription.paused"):
        db.table("users").update({"tier": "free"}).eq("stripe_customer_id", obj["customer"]).execute()

    return {"received": True}

def _record_commission(clerk_id: str, stripe_event_id: str, amount: float, plan_type: str):
    user = db.table("users").select("ref_code").eq("id", clerk_id).maybe_single().execute().data
    if not user or not user.get("ref_code"):
        return
    tutor = db.table("tutors").select("id,commission_pct").eq("ref_code", user["ref_code"]).eq("status", "active").maybe_single().execute().data
    if not tutor:
        return
    commission = round(amount * float(tutor["commission_pct"]) / 100, 2)
    db.table("commissions").insert({
        "tutor_id": tutor["id"],
        "user_id": clerk_id,
        "stripe_event_id": stripe_event_id,
        "plan_type": plan_type,
        "amount_usd": amount,
        "commission_usd": commission,
        "month": datetime.now(timezone.utc).strftime("%Y-%m"),
        "status": "pending",
    }).execute()

@router.post("/create-checkout-session")
async def create_checkout(
    price_id: str = Body(..., embed=True),
    user_payload: dict = Depends(get_current_user),
):
    try:
        clerk_id = user_payload["sub"]

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            client_reference_id=clerk_id,
            billing_address_collection="required",
            allow_promotion_codes=True,
            success_url=settings.STRIPE_SUCCESS_URL,
            cancel_url=settings.STRIPE_CANCEL_URL,
        )

        return {"url": session.url}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))