"""
config.py — Single source of truth for ALL configuration.
Change values here or via environment variables. Never hardcode
anything in routers or services.
"""
from __future__ import annotations
from pydantic_settings import BaseSettings
from typing import Any

# ─────────────────────────────────────────────────────────────────────────────
# Language & Voice Registry
# To add a new language: add one entry here. Nothing else changes.
# ─────────────────────────────────────────────────────────────────────────────
LANGUAGES: dict[str, dict[str, Any]] = {
    "english": {
        "label": "English",
        "flag": "🇬🇧",
        "whisper_code": "en",
        "default_accent": "american",
        "accents": {
            "american":   {"voice_id": "9BWtsMINqrJLrRacOk9x", "label": "🇺🇸 American"},
            "british":    {"voice_id": "JBFqnCBsd6RMkjVDRZzb", "label": "🇬🇧 British"},
            "australian": {"voice_id": "TX3LPaxmHKxFdv7VOQHJ", "label": "🇦🇺 Australian"},
        },
        "word_voice_id": "bIHbv24MWmeRgasZH58o",
    },
    "german": {
        "label": "German",
        "flag": "🇩🇪",
        "whisper_code": "de",
        "default_accent": "standard",
        "accents": {
            "standard": {"voice_id": "GBv7mTt0atIp3Br8iCZE", "label": "🇩🇪 Standard"},
        },
        "word_voice_id": "GBv7mTt0atIp3Br8iCZE",
    },
    "spanish": {
        "label": "Spanish",
        "flag": "🇪🇸",
        "whisper_code": "es",
        "default_accent": "latin_american",
        "accents": {
            "latin_american": {"voice_id": "pqHfZKP75CvOlQylNhV4", "label": "🇲🇽 Latin American"},
            "castilian":      {"voice_id": "onwK4e9ZLuTAKqWW03F9", "label": "🇪🇸 Castilian"},
        },
        "word_voice_id": "pqHfZKP75CvOlQylNhV4",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# Tier definitions
# To change limits: edit values here and redeploy. No DB migration needed.
# monthly_analyses: None = unlimited
# ─────────────────────────────────────────────────────────────────────────────
TIERS: dict[str, dict[str, Any]] = {
    "blocked": {
        "monthly_analyses": 0,
        "max_recording_secs": 0,
        "max_phrase_chars": 0,
        "welcome_bonus": 0,
    },
    "free": {
        "monthly_analyses": 1000,
        "max_recording_secs": 30,
        "max_phrase_chars": 200,
        "welcome_bonus": 3,
    },
    "trial": {
        "monthly_analyses": 20,
        "max_recording_secs": 45,
        "max_phrase_chars": 300,
        "welcome_bonus": 0,
    },
    "pro": {
        "monthly_analyses": None,
        "max_recording_secs": 60,
        "max_phrase_chars": 500,
        "welcome_bonus": 0,
    },
    "admin": {
        "monthly_analyses": None,
        "max_recording_secs": 300,
        "max_phrase_chars": 2000,
        "welcome_bonus": 0,
    },
}


class Settings(BaseSettings):
    # ── OpenAI ──────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    WHISPER_MODEL: str = "whisper-1"
    GPT_ANALYSIS_MODEL: str = "gpt-4o-mini"

    # ── ElevenLabs ──────────────────────────────────────────────────────────
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_PHRASE_MODEL: str = "eleven_multilingual_v2"
    ELEVENLABS_WORD_MODEL: str = "eleven_turbo_v2_5"
    ELEVENLABS_STABILITY: float = 0.4
    ELEVENLABS_SIMILARITY_BOOST: float = 0.85
    ELEVENLABS_STYLE: float = 0.3

    # ── Clerk ───────────────────────────────────────────────────────────────
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""
    CLERK_JWKS_URL: str = "https://api.clerk.dev/v1/jwks"
    ADMIN_CLERK_USER_ID: str = ""       # Your personal Clerk user ID
    CLERK_JWT_KEY: str = ""             # Your personal Clerk JWT key

    # ── Supabase ────────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Stripe ──────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_MONTHLY_PRICE_ID: str = ""
    STRIPE_PRO_ANNUAL_PRICE_ID: str = ""
    STRIPE_SUCCESS_URL: str = "http://localhost:3000/dashboard?upgraded=true"
    STRIPE_CANCEL_URL: str = "http://localhost:3000/pricing"

    # ── Feature Flags (change via env, no redeploy of logic needed) ─────────
    GLOBAL_FREE_MODE: bool = False       # True = everyone gets pro
    WORD_TTS_ENABLED: bool = True
    ACCENT_SELECTOR_ENABLED: bool = True
    PHONETICS_ENABLED: bool = True

    # ── CORS ────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
