from fastapi import APIRouter, Request, HTTPException, Header
import stripe
from app.config import settings
from app.services.supabase_client import supabase

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(...)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = event["data"]["object"]

    if event["type"] == "customer.subscription.created":
        _update_subscription(data["customer"], "pro")
    elif event["type"] == "customer.subscription.updated":
        status = data["status"]
        _update_subscription(data["customer"], "pro" if status == "active" else "free")
    elif event["type"] in ("customer.subscription.deleted", "customer.subscription.paused"):
        _update_subscription(data["customer"], "free")
    elif event["type"] == "checkout.session.completed":
        customer_id = data.get("customer")
        client_ref = data.get("client_reference_id")  # Clerk user ID passed at checkout
        if customer_id and client_ref:
            supabase.table("users").update({"stripe_customer_id": customer_id}).eq("id", client_ref).execute()

    return {"received": True}

def _update_subscription(stripe_customer_id: str, status: str):
    supabase.table("users").update({"subscription_status": status}).eq("stripe_customer_id", stripe_customer_id).execute()
