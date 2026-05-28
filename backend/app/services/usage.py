"""
usage.py — All user/limit/usage logic in one place.
This is the gatekeeper: every analysis request goes through here.
"""
from __future__ import annotations
from datetime import datetime, timezone
from app.services.db import db
from app.config import settings, TIERS


def current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _data(res):
    return getattr(res, "data", None) if res is not None else None


# ─────────────────────────────────────────────────────────────────────────────
# User
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_user(clerk_id: str, email: str = "") -> dict:
    """Fetch user from DB, create on first login."""
    res = db.table("users").select("*").eq("id", clerk_id).maybe_single().execute()
    user = _data(res)

    if user:
        return user

    user = {
        "id": clerk_id,
        "email": email,
        "tier": "free",
        "welcome_bonus_remaining": TIERS["free"]["welcome_bonus"],
        "plan_overrides": {},
    }

    insert_res = db.table("users").insert(user).execute()
    inserted = _data(insert_res)

    if isinstance(inserted, list) and inserted:
        return inserted[0]
    if isinstance(inserted, dict):
        return inserted

    return user


# ─────────────────────────────────────────────────────────────────────────────
# Limit resolution
# ─────────────────────────────────────────────────────────────────────────────

def get_effective_limits(user: dict) -> dict:
    if settings.GLOBAL_FREE_MODE and not user.get("is_globally_free_exempt"):
        return {**TIERS["pro"], "tier": "pro"}

    tier = user.get("tier", "free")

    expires = user.get("tier_expires_at")
    if expires:
        exp = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > exp:
            tier = "free"
            db.table("users").update(
                {"tier": "free", "tier_expires_at": None}
            ).eq("id", user["id"]).execute()

    base = {**TIERS.get(tier, TIERS["free"]), "tier": tier}

    for k in ("monthly_analyses", "max_recording_secs", "max_phrase_chars"):
        override = (user.get("plan_overrides") or {}).get(k)
        if override is not None:
            base[k] = override

    return base


# ─────────────────────────────────────────────────────────────────────────────
# Usage tracking
# ─────────────────────────────────────────────────────────────────────────────

def get_usage(clerk_id: str) -> dict:
    month = current_month()
    res = (
        db.table("usage")
        .select("*")
        .eq("user_id", clerk_id)
        .eq("month", month)
        .maybe_single()
        .execute()
    )
    return _data(res) or {"user_id": clerk_id, "month": month, "analysis_count": 0}


def check_and_consume(clerk_id: str) -> tuple[bool, str]:
    """Returns (allowed, reason). Consumes one analysis if allowed."""
    res = db.table("users").select("*").eq("id", clerk_id).maybe_single().execute()
    user = _data(res)

    if not user:
        return False, "user_not_found"

    limits = get_effective_limits(user)

    if limits["monthly_analyses"] == 0:
        return False, "account_blocked"

    if limits["monthly_analyses"] is None:
        _increment(clerk_id)
        return True, "ok"

    welcome = user.get("welcome_bonus_remaining", 0)
    if welcome > 0:
        db.table("users").update(
            {"welcome_bonus_remaining": welcome - 1}
        ).eq("id", clerk_id).execute()
        return True, "ok"

    used = get_usage(clerk_id).get("analysis_count", 0)
    if used >= limits["monthly_analyses"]:
        return False, "limit_reached"

    _increment(clerk_id)
    return True, "ok"


def _increment(clerk_id: str):
    month = current_month()
    existing_res = (
        db.table("usage")
        .select("analysis_count")
        .eq("user_id", clerk_id)
        .eq("month", month)
        .maybe_single()
        .execute()
    )
    existing = _data(existing_res)

    if existing:
        db.table("usage").update(
            {"analysis_count": existing["analysis_count"] + 1}
        ).eq("user_id", clerk_id).eq("month", month).execute()
    else:
        db.table("usage").insert(
            {"user_id": clerk_id, "month": month, "analysis_count": 1}
        ).execute()
        