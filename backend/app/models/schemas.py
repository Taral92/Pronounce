from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Literal, Optional, Any
from app.config import LANGUAGES


class AnalyzeRequest(BaseModel):
    phrase: Optional[str] = None
    mode: Literal["guided", "free"] = "guided"
    language: str = "english"
    accent: str = "american"

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in LANGUAGES:
            raise ValueError(f"Unsupported language. Choose: {list(LANGUAGES.keys())}")
        return v

    @field_validator("accent")
    @classmethod
    def validate_accent(cls, v: str, info: Any) -> str:
        lang = info.data.get("language", "english")
        if lang in LANGUAGES and v not in LANGUAGES[lang]["accents"]:
            return LANGUAGES[lang]["default_accent"]
        return v


class WordPartsFeedback(BaseModel):
    start: Optional[str] = None
    middle: Optional[str] = None
    end: Optional[str] = None


class PracticeWord(BaseModel):
    word: str
    spoken: Optional[str] = None
    phonetic: Optional[str] = None
    severity: Literal["low", "medium", "high"]
    what_was_good: Optional[str] = None
    what_to_fix: str
    next_try_tip: str
    parts: Optional[WordPartsFeedback] = None
    user_audio_base64: Optional[str] = None


class AnalyzeResponse(BaseModel):
    mode: Literal["guided", "free"]

    overall_score: int

    pronunciation_score: Optional[float] = None
    accuracy_score: Optional[float] = None
    fluency_score: Optional[float] = None
    prosody_score: Optional[float] = None
    completeness_score: Optional[float] = None

    overall_feedback: str
    transcribed: str
    intended: Optional[str] = None
    language: str
    accent: str

    native_audio_base64: Optional[str] = None
    full_user_audio_base64: str

    practice_words: list[PracticeWord]

    analyses_remaining: Optional[int] = None

class AudioResponse(BaseModel):
    audio_base64: str


class UserLimits(BaseModel):
    monthly_analyses: Optional[int]
    max_recording_secs: int
    max_phrase_chars: int
    analyses_used: int
    analyses_remaining: Optional[int]
    welcome_bonus_remaining: int
    tier: str
    global_free_mode: bool
    languages_available: list[str]
    word_tts_enabled: bool
    accent_selector_enabled: bool
    phonetics_enabled: bool


class LanguageInfo(BaseModel):
    key: str
    label: str
    flag: str
    accents: dict[str, Any]
    default_accent: str


class TutorCreate(BaseModel):
    name: str
    email: str
    ref_code: str
    commission_pct: float = 20.0
    notes: str = ""


class TutorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    commission_pct: Optional[float] = None
    status: Optional[Literal["active", "paused", "blocked"]] = None
    notes: Optional[str] = None
    clerk_user_id: Optional[str] = None


class TutorStats(BaseModel):
    id: str
    name: str
    email: str
    ref_code: str
    commission_pct: float
    status: str
    notes: str
    total_signups: int
    subscribed: int
    conversion_rate: float
    pending_payout: float
    total_paid: float
    created_at: str


class CommissionRecord(BaseModel):
    id: str
    tutor_id: str
    tutor_name: str
    user_id: str
    user_email: Optional[str]
    plan_type: Optional[str]
    amount_usd: float
    commission_usd: float
    month: str
    status: str
    created_at: str


class AdminStats(BaseModel):
    total_tutors: int
    active_tutors: int
    total_signups_via_ref: int
    total_subscribed_via_ref: int
    total_pending_payout: float
    total_paid_out: float
    total_revenue_via_ref: float