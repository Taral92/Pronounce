from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services import whisper, gpt
from app.services.audio_clip import clip_audio_bytes, find_best_word_span, to_base64 as clip_to_base64
from app.services.usage import check_and_consume, get_or_create_user, get_usage, get_effective_limits
from app.models.schemas import AnalyzeResponse, PracticeWord, WordPartsFeedback
from app.config import LANGUAGES

router = APIRouter(prefix="/analyze", tags=["analyze"])

@router.post("", response_model=AnalyzeResponse)
async def analyze(
    audio: UploadFile = File(...),
    mode: str = Form("guided"),
    phrase: str | None = Form(None),
    language: str = Form("english"),
    accent: str = Form("american"),
    user_payload: dict = Depends(get_current_user),
):
    clerk_id = user_payload["sub"]
    email = user_payload.get("email", "")
    user = get_or_create_user(clerk_id, email)
    limits = get_effective_limits(user)

    if limits["monthly_analyses"] == 0:
        raise HTTPException(status_code=403, detail="account_blocked")

    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    if mode not in {"guided", "free"}:
        raise HTTPException(status_code=400, detail="invalid_mode")

    cleaned_phrase = (phrase or "").strip()

    if mode == "guided":
        if not cleaned_phrase:
            raise HTTPException(status_code=400, detail="Phrase is required in guided mode")
        if len(cleaned_phrase) > limits["max_phrase_chars"]:
            raise HTTPException(status_code=400, detail=f"Phrase too long. Max {limits['max_phrase_chars']} chars.")

    allowed, reason = check_and_consume(clerk_id)
    if not allowed:
        raise HTTPException(status_code=402, detail=reason)

    audio_bytes = await audio.read()
    whisper_code = LANGUAGES[language]["whisper_code"]

    transcription = await whisper.transcribe(
        audio_bytes,
        whisper_code,
        audio.filename or "recording.webm"
    )

    analysis = await gpt.analyze(
        mode=mode,
        intended=cleaned_phrase if cleaned_phrase else None,
        transcribed=transcription,
        language=language,
        accent=accent,
    )

    used_indexes: set[int] = set()
    practice_words: list[PracticeWord] = []

    for item in analysis.get("practice_words", []):
        parts = item.get("parts") or {}
        span = find_best_word_span(item.get("word", ""), transcription.get("words", []), used_indexes)

        user_audio_b64 = None
        if span:
            try:
                clipped = clip_audio_bytes(audio_bytes, span[0], span[1], suffix=".webm")
                user_audio_b64 = clip_to_base64(clipped)
            except Exception:
                user_audio_b64 = None

        practice_words.append(
            PracticeWord(
                word=item.get("word", ""),
                spoken=item.get("spoken"),
                phonetic=item.get("phonetic"),
                severity=item.get("severity", "medium"),
                what_was_good=item.get("what_was_good"),
                what_to_fix=item.get("what_to_fix", ""),
                next_try_tip=item.get("next_try_tip", ""),
                parts=WordPartsFeedback(
                    start=parts.get("start"),
                    middle=parts.get("middle"),
                    end=parts.get("end"),
                ) if parts else None,
                user_audio_base64=user_audio_b64,
            )
        )

    usage = get_usage(clerk_id)
    monthly = limits["monthly_analyses"]
    welcome = user.get("welcome_bonus_remaining", 0)
    remaining = None if monthly is None else max(0, monthly - usage.get("analysis_count", 0) + welcome)

    return AnalyzeResponse(
        mode=mode,
        overall_score=analysis.get("overall_score", 0),
        overall_feedback=analysis.get("overall_feedback", ""),
        transcribed=transcription.get("text", ""),
        intended=cleaned_phrase if cleaned_phrase else None,
        language=language,
        accent=accent,
        full_user_audio_base64=clip_to_base64(audio_bytes),
        practice_words=practice_words,
        analyses_remaining=remaining,
    )