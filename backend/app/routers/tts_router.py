from fastapi import APIRouter, Query, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services import tts
from app.models.schemas import AudioResponse
from app.config import settings, LANGUAGES

router = APIRouter(prefix="/tts", tags=["tts"])

@router.get("/word", response_model=AudioResponse)
async def word_tts(
    w: str = Query(..., max_length=60),
    language: str = Query("english"),
    _: dict = Depends(get_current_user),
):
    if not settings.WORD_TTS_ENABLED:
        raise HTTPException(status_code=403, detail="word_tts_disabled")
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="unsupported_language")

    word = w.strip()
    if not word:
        raise HTTPException(status_code=400, detail="empty_word")

    audio_b64 = await tts.safe_word_base64(word, language)
    if not audio_b64:
        raise HTTPException(status_code=502, detail="word_tts_failed")
    return AudioResponse(audio_base64=audio_b64)

@router.get("/feedback", response_model=AudioResponse)
async def feedback_tts(
    text: str = Query(..., max_length=300),
    language: str = Query("english"),
    accent: str = Query("american"),
    _: dict = Depends(get_current_user),
):
    if not settings.WORD_TTS_ENABLED:
        raise HTTPException(status_code=403, detail="word_tts_disabled")
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="unsupported_language")

    content = text.strip()
    if not content:
        raise HTTPException(status_code=400, detail="empty_feedback")

    audio_b64 = await tts.safe_feedback_base64(content, language, accent)
    if not audio_b64:
        raise HTTPException(status_code=502, detail="feedback_tts_failed")
    return AudioResponse(audio_base64=audio_b64)