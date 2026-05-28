from fastapi import APIRouter, Depends
from app.middleware.auth import get_tutor_user
from app.services.db import db

router = APIRouter(prefix="/tutor", tags=["tutor"])

@router.get("/stats")
async def tutor_stats(user_payload: dict = Depends(get_tutor_user)):
    ref_code = (user_payload.get("public_metadata") or {}).get("ref_code")
    if not ref_code:
        return {"error": "No ref_code assigned to this tutor"}

    tutor = db.table("tutors").select("*").eq("ref_code", ref_code).maybe_single().execute().data
    if not tutor:
        return {"error": "Tutor not found"}

    signups = db.table("users").select("id,ref_converted,created_at").eq("ref_code", ref_code).execute().data or []
    commissions = db.table("commissions").select("*").eq("tutor_id", tutor["id"]).execute().data or []

    pending = sum(c["commission_usd"] for c in commissions if c["status"] == "pending")
    paid = sum(c["commission_usd"] for c in commissions if c["status"] == "paid")

    monthly: dict = {}
    for c in commissions:
        m = c["month"]
        if m not in monthly:
            monthly[m] = {"month": m, "count": 0, "earned": 0.0, "status": c["status"]}
        monthly[m]["count"] += 1
        monthly[m]["earned"] = round(monthly[m]["earned"] + c["commission_usd"], 2)

    return {
        "tutor": tutor,
        "ref_link": f"https://pronounce.app/?ref={ref_code}",
        "total_signups": len(signups),
        "subscribed": sum(1 for s in signups if s.get("ref_converted")),
        "pending_payout": round(pending, 2),
        "total_paid": round(paid, 2),
        "monthly_breakdown": sorted(monthly.values(), key=lambda x: x["month"], reverse=True),
    }
