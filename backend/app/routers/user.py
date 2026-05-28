from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.services.usage import get_or_create_user, get_usage, get_effective_limits
from app.models.schemas import UserLimits, LanguageInfo
from app.config import settings, LANGUAGES

router = APIRouter(prefix="/me", tags=["user"])

@router.get("/limits", response_model=UserLimits)
async def get_limits(user_payload: dict = Depends(get_current_user)):
    clerk_id = user_payload["sub"]
    user = get_or_create_user(clerk_id, user_payload.get("email", ""))
    limits = get_effective_limits(user)
    usage = get_usage(clerk_id)
    used = usage.get("analysis_count", 0)
    welcome = user.get("welcome_bonus_remaining", 0)
    monthly = limits["monthly_analyses"]
    remaining = None if monthly is None else max(0, monthly - used + welcome)
    return UserLimits(
        monthly_analyses=monthly,
        max_recording_secs=limits["max_recording_secs"],
        max_phrase_chars=limits["max_phrase_chars"],
        analyses_used=used,
        analyses_remaining=remaining,
        welcome_bonus_remaining=welcome,
        tier=limits["tier"],
        global_free_mode=settings.GLOBAL_FREE_MODE,
        languages_available=list(LANGUAGES.keys()),
        word_tts_enabled=settings.WORD_TTS_ENABLED,
        accent_selector_enabled=settings.ACCENT_SELECTOR_ENABLED,
        phonetics_enabled=settings.PHONETICS_ENABLED,
    )

@router.get("/languages", response_model=list[LanguageInfo])
async def get_languages(_: dict = Depends(get_current_user)):
    return [
        LanguageInfo(key=k, label=v["label"], flag=v["flag"],
                     accents=v["accents"], default_accent=v["default_accent"])
        for k, v in LANGUAGES.items()
    ]
