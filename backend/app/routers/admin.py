from fastapi import APIRouter, Depends, HTTPException, Body
from app.middleware.auth import get_admin_user
from app.services.db import db
from app.models.schemas import TutorCreate, TutorUpdate, AdminStats
import secrets, string

router = APIRouter(prefix="/admin", tags=["admin"])

def _gen_ref_code(name: str) -> str:
    slug = name.lower().replace(" ", "-")[:12]
    suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(4))
    return f"{slug}-{suffix}"

@router.get("/stats", response_model=AdminStats)
async def admin_stats(_: dict = Depends(get_admin_user)):
    tutors = db.table("tutors").select("id,status").execute().data or []
    users = db.table("users").select("id,ref_code,ref_converted").execute().data or []
    commissions = db.table("commissions").select("commission_usd,amount_usd,status").execute().data or []
    return AdminStats(
        total_tutors=len(tutors),
        active_tutors=sum(1 for t in tutors if t["status"] == "active"),
        total_signups_via_ref=sum(1 for u in users if u.get("ref_code")),
        total_subscribed_via_ref=sum(1 for u in users if u.get("ref_converted")),
        total_pending_payout=round(sum(c["commission_usd"] for c in commissions if c["status"] == "pending"), 2),
        total_paid_out=round(sum(c["commission_usd"] for c in commissions if c["status"] == "paid"), 2),
        total_revenue_via_ref=round(sum(c["amount_usd"] for c in commissions), 2),
    )

@router.get("/tutors")
async def list_tutors(_: dict = Depends(get_admin_user)):
    tutors = db.table("tutors").select("*").order("created_at", desc=True).execute().data or []
    result = []
    for t in tutors:
        signups = db.table("users").select("id,ref_converted").eq("ref_code", t["ref_code"]).execute().data or []
        commissions = db.table("commissions").select("commission_usd,status").eq("tutor_id", t["id"]).execute().data or []
        subscribed = sum(1 for u in signups if u.get("ref_converted"))
        result.append({
            **t,
            "total_signups": len(signups),
            "subscribed": subscribed,
            "conversion_rate": round(subscribed / len(signups) * 100, 1) if signups else 0.0,
            "pending_payout": round(sum(c["commission_usd"] for c in commissions if c["status"] == "pending"), 2),
            "total_paid": round(sum(c["commission_usd"] for c in commissions if c["status"] == "paid"), 2),
        })
    return result

@router.post("/tutors")
async def create_tutor(data: TutorCreate, _: dict = Depends(get_admin_user)):
    ref = data.ref_code or _gen_ref_code(data.name)
    existing = db.table("tutors").select("id").eq("ref_code", ref).maybe_single().execute().data
    if existing:
        raise HTTPException(status_code=400, detail="ref_code already exists")
    tutor = db.table("tutors").insert({
        "name": data.name, "email": data.email, "ref_code": ref,
        "commission_pct": data.commission_pct, "notes": data.notes, "status": "active",
    }).execute().data
    return tutor

@router.put("/tutors/{tutor_id}")
async def update_tutor(tutor_id: str, data: TutorUpdate, _: dict = Depends(get_admin_user)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    db.table("tutors").update(updates).eq("id", tutor_id).execute()
    return {"updated": True}

@router.get("/commissions")
async def list_commissions(
    tutor_id: str = None,
    month: str = None,
    status: str = None,
    _: dict = Depends(get_admin_user)
):
    query = db.table("commissions").select("*, tutors(name, email), users(email)")
    if tutor_id: query = query.eq("tutor_id", tutor_id)
    if month: query = query.eq("month", month)
    if status: query = query.eq("status", status)
    return query.order("created_at", desc=True).execute().data or []

@router.put("/commissions/{commission_id}/pay")
async def mark_paid(commission_id: str, _: dict = Depends(get_admin_user)):
    from datetime import datetime, timezone
    db.table("commissions").update({
        "status": "paid",
        "paid_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", commission_id).execute()
    return {"paid": True}

@router.get("/tutors/{tutor_id}/students")
async def tutor_students(tutor_id: str, _: dict = Depends(get_admin_user)):
    tutor = db.table("tutors").select("ref_code").eq("id", tutor_id).maybe_single().execute().data
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor not found")
    return db.table("users").select("id,email,tier,ref_converted,created_at").eq("ref_code", tutor["ref_code"]).order("created_at", desc=True).execute().data or []
