from fastapi import APIRouter, Request, HTTPException, Header
from app.services.db import db
from app.config import settings
import svix

router = APIRouter(tags=["clerk"])

@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request, svix_id: str = Header(...), svix_timestamp: str = Header(...), svix_signature: str = Header(...)):
    payload = await request.body()
    try:
        wh = svix.Webhook(settings.CLERK_WEBHOOK_SECRET)
        event = wh.verify(payload, {"svix-id": svix_id, "svix-timestamp": svix_timestamp, "svix-signature": svix_signature})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "user.created":
        data = event["data"]
        clerk_id = data["id"]
        email = (data.get("email_addresses") or [{}])[0].get("email_address", "")
        ref_code = data.get("unsafe_metadata", {}).get("ref_code")
        user = {"id": clerk_id, "email": email, "tier": "free", "welcome_bonus_remaining": 3, "plan_overrides": {}}
        if ref_code:
            tutor = db.table("tutors").select("ref_code").eq("ref_code", ref_code).eq("status", "active").maybe_single().execute().data
            if tutor:
                user["ref_code"] = ref_code
        db.table("users").upsert(user).execute()

    return {"received": True}
