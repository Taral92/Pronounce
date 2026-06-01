from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
import tempfile
import subprocess
import os

from app.middleware.auth import get_current_user
from app.services import gpt, tts
from app.services.speech_assessment import assess as speech_assess
from app.services.azure_speech import assess_pronunciation
from app.services.audio_clip import clip_audio_bytes, find_best_word_span, to_base64 as clip_to_base64
from app.services.usage import check_and_consume, get_or_create_user, get_usage, get_effective_limits
from app.models.schemas import (
    AnalyzeResponse,
    PracticeWord,
    WordPartsFeedback,
    AnalyzedWordScore,
    SyllableScore,
    PhonemeScore,
)
from app.config import LANGUAGES


router = APIRouter(prefix="/analyze", tags=["analyze"])

_SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(str(value).split()).strip()
    return cleaned or None


def _build_sound_map(azure_scores: dict | None) -> list[AnalyzedWordScore]:
    if not azure_scores:
        return []

    raw = azure_scores.get("raw") or {}
    nbest = (raw.get("NBest") or [{}])[0]
    words = nbest.get("Words") or []

    result: list[AnalyzedWordScore] = []

    for word in words:
        pa = word.get("PronunciationAssessment") or {}

        syllables = [
            SyllableScore(
                syllable=s.get("Syllable", ""),
                grapheme=s.get("Grapheme"),
                accuracy_score=(s.get("PronunciationAssessment") or {}).get("AccuracyScore"),
                offset=s.get("Offset"),
                duration=s.get("Duration"),
            )
            for s in (word.get("Syllables") or [])
        ]

        phonemes = [
            PhonemeScore(
                phoneme=p.get("Phoneme", ""),
                accuracy_score=(p.get("PronunciationAssessment") or {}).get("AccuracyScore"),
                offset=p.get("Offset"),
                duration=p.get("Duration"),
            )
            for p in (word.get("Phonemes") or [])
        ]

        result.append(
            AnalyzedWordScore(
                word=word.get("Word", ""),
                accuracy_score=pa.get("AccuracyScore"),
                error_type=pa.get("ErrorType"),
                offset=word.get("Offset"),
                duration=word.get("Duration"),
                syllables=syllables,
                phonemes=phonemes,
            )
        )

    return result


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

    if accent not in LANGUAGES[language]["accents"]:
        accent = LANGUAGES[language]["default_accent"]

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
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="empty_audio")

    whisper_code = LANGUAGES[language]["whisper_code"]

    speech_result = await speech_assess(
        audio_bytes=audio_bytes,
        language_code=whisper_code,
        reference_text=cleaned_phrase if mode == "guided" else None,
        filename=audio.filename or "recording.webm",
    )

    transcription = speech_result["transcription"]
    azure_scores = speech_result["assessment"]

    transcript_text = _clean_text(transcription.get("text")) or ""

    native_text = cleaned_phrase if mode == "guided" else transcript_text
    native_audio_bytes = None

    if native_text:
        try:
            native_audio_bytes = await tts.phrase(native_text, language, accent)
            print("native_tts_ok", {
                "mode": mode,
                "language": language,
                "accent": accent,
                "text": native_text,
                "bytes": len(native_audio_bytes) if native_audio_bytes else 0,
            })
        except Exception as e:
            print("native_tts_failed", {
                "mode": mode,
                "language": language,
                "accent": accent,
                "text": native_text,
                "error": repr(e),
            })
            native_audio_bytes = None

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
        word = _clean_text(item.get("word"))
        what_to_fix = _clean_text(item.get("what_to_fix"))
        next_try_tip = _clean_text(item.get("next_try_tip"))
        if not word or not what_to_fix or not next_try_tip:
            continue

        parts = item.get("parts") or {}
        span = find_best_word_span(word, transcription.get("words", []), used_indexes)

        user_audio_b64 = None
        if span:
            try:
                clipped = clip_audio_bytes(audio_bytes, span[0], span[1], suffix=".webm")
                user_audio_b64 = clip_to_base64(clipped)
            except Exception:
                user_audio_b64 = None

        practice_words.append(
            PracticeWord(
                word=word,
                spoken=_clean_text(item.get("spoken")),
                phonetic=_clean_text(item.get("phonetic")),
                severity=item.get("severity", "medium") if item.get("severity") in _SEVERITY_RANK else "medium",
                what_was_good=_clean_text(item.get("what_was_good")),
                what_to_fix=what_to_fix,
                next_try_tip=next_try_tip,
                parts=WordPartsFeedback(
                    start=_clean_text(parts.get("start")),
                    middle=_clean_text(parts.get("middle")),
                    end=_clean_text(parts.get("end")),
                ) if parts else None,
                user_audio_base64=user_audio_b64,
            )
        )

    practice_words = sorted(
        practice_words,
        key=lambda w: (_SEVERITY_RANK.get(w.severity, 1), len(w.word))
    )[:5]

    overall_feedback = _clean_text(analysis.get("overall_feedback"))
    if not overall_feedback:
        overall_feedback = (
            "Clear overall pronunciation with a few small fixes to sound more natural."
            if practice_words else
            "Clear, natural pronunciation overall. Nice control and good intelligibility."
        )

    usage = get_usage(clerk_id)
    monthly = limits["monthly_analyses"]
    welcome = user.get("welcome_bonus_remaining", 0)
    remaining = None if monthly is None else max(0, monthly - usage.get("analysis_count", 0) + welcome)

    return AnalyzeResponse(
        mode=mode,
        overall_score=max(0, min(100, int(analysis.get("overall_score", 0) or 0))),
        pronunciation_score=azure_scores.get("pronunciation_score") if azure_scores else None,
        accuracy_score=azure_scores.get("accuracy_score") if azure_scores else None,
        fluency_score=azure_scores.get("fluency_score") if azure_scores else None,
        prosody_score=azure_scores.get("prosody_score") if azure_scores else None,
        completeness_score=azure_scores.get("completeness_score") if azure_scores else None,
        overall_feedback=overall_feedback,
        transcribed=transcript_text,
        intended=cleaned_phrase if cleaned_phrase else None,
        language=language,
        accent=accent,
        native_audio_base64=clip_to_base64(native_audio_bytes) if native_audio_bytes else None,
        full_user_audio_base64=clip_to_base64(audio_bytes),
        practice_words=practice_words,
        analyses_remaining=remaining,
        sound_map=_build_sound_map(azure_scores),
    )


@router.post("/azure-debug")
async def azure_debug(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as src:
        src.write(audio_bytes)
        src_path = src.name

    wav_path = src_path.replace(".webm", ".wav")

    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", src_path,
                "-ar", "16000",
                "-ac", "1",
                wav_path,
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        result = assess_pronunciation(wav_path, "hello how are you")
        return result

    finally:
        if os.path.exists(src_path):
            os.remove(src_path)
        if os.path.exists(wav_path):
            os.remove(wav_path)