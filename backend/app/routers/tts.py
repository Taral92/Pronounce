import asyncio
import base64
import re

import httpx

from app.config import settings, LANGUAGES


_HEADERS = {
    "xi-api-key": settings.ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
    "Accept": "audio/mpeg",
}

_VOICE_SETTINGS = {
    "stability": settings.ELEVENLABS_STABILITY,
    "similarity_boost": settings.ELEVENLABS_SIMILARITY_BOOST,
    "style": settings.ELEVENLABS_STYLE,
    "use_speaker_boost": True,
}

_RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
_MAX_FEEDBACK_CHARS = 260


def _normalize_text(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[.]{2,}", ".", text)
    text = re.sub(r"[!]{2,}", "!", text)
    text = re.sub(r"[?]{2,}", "?", text)
    return text.strip()


def _sanitize_feedback_text(text: str) -> str:
    text = _normalize_text(text)
    text = text.replace("’", "'").replace("“", "\"").replace("”", "\"")

    if len(text) <= _MAX_FEEDBACK_CHARS:
        return text

    trimmed = text[:_MAX_FEEDBACK_CHARS].rsplit(" ", 1)[0].strip()
    return f"{trimmed}..." if trimmed else text[:_MAX_FEEDBACK_CHARS]


async def _synthesize(voice_id: str, text: str, model: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text,
        "model_id": model,
        "voice_settings": _VOICE_SETTINGS,
    }

    timeout = httpx.Timeout(30.0, connect=10.0)
    last_error = None

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(3):
            try:
                resp = await client.post(url, json=payload, headers=_HEADERS)

                print("elevenlabs_tts", {
                    "status": resp.status_code,
                    "voice_id": voice_id,
                    "model": model,
                    "text_len": len(text),
                })

                if resp.status_code in _RETRYABLE_STATUSES:
                    detail = resp.text[:500]
                    last_error = RuntimeError(
                        f"Retryable ElevenLabs error {resp.status_code}: {detail}"
                    )
                    if attempt < 2:
                        await asyncio.sleep(0.6 * (2 ** attempt))
                        continue
                    raise last_error

                try:
                    resp.raise_for_status()
                except httpx.HTTPStatusError as e:
                    detail = resp.text[:500]
                    raise RuntimeError(
                        f"ElevenLabs error {resp.status_code}: {detail}"
                    ) from e

                if not resp.content:
                    raise RuntimeError("ElevenLabs returned empty audio content")

                return resp.content

            except (httpx.TimeoutException, httpx.NetworkError) as e:
                last_error = e
                if attempt < 2:
                    await asyncio.sleep(0.6 * (2 ** attempt))
                    continue
                raise

    raise last_error or RuntimeError("Unknown ElevenLabs synthesis failure")


async def phrase(text: str, language: str, accent: str) -> bytes:
    text = _normalize_text(text)
    lang = LANGUAGES.get(language, LANGUAGES["english"])
    accent_cfg = lang["accents"].get(accent, list(lang["accents"].values())[0])

    print("phrase_tts_request", {
        "language": language,
        "accent": accent,
        "voice_id": accent_cfg.get("voice_id"),
        "text": text,
    })

    return await _synthesize(
        accent_cfg["voice_id"],
        text,
        settings.ELEVENLABS_PHRASE_MODEL,
    )


async def word(text: str, language: str) -> bytes:
    text = _normalize_text(text)
    lang = LANGUAGES.get(language, LANGUAGES["english"])

    return await _synthesize(
        lang["word_voice_id"],
        text,
        settings.ELEVENLABS_WORD_MODEL,
    )


async def feedback(text: str, language: str, accent: str | None = None) -> bytes:
    text = _sanitize_feedback_text(text)
    lang = LANGUAGES.get(language, LANGUAGES["english"])

    if accent and accent in lang["accents"]:
        voice_id = lang["accents"][accent]["voice_id"]
    else:
        voice_id = list(lang["accents"].values())[0]["voice_id"]

    return await _synthesize(
        voice_id,
        text,
        settings.ELEVENLABS_PHRASE_MODEL,
    )


def to_base64(audio: bytes) -> str:
    return base64.b64encode(audio).decode("utf-8")


async def safe_phrase_base64(
    text: str,
    language: str,
    accent: str,
) -> str | None:
    try:
        audio = await phrase(text, language, accent)
        if not audio:
            print("safe_phrase_base64_empty_audio", {
                "language": language,
                "accent": accent,
                "text": text,
            })
            return None
        return to_base64(audio)
    except Exception as e:
        print("safe_phrase_base64_failed", {
            "language": language,
            "accent": accent,
            "text": text,
            "error": repr(e),
        })
        return None


async def safe_word_base64(text: str, language: str) -> str:
    try:
        audio = await word(text, language)
        return to_base64(audio)
    except Exception as e:
        print("safe_word_base64_failed", {
            "language": language,
            "text": text,
            "error": repr(e),
        })
        return ""


async def safe_feedback_base64(
    text: str,
    language: str,
    accent: str | None = None,
) -> str:
    try:
        audio = await feedback(text, language, accent)
        return to_base64(audio)
    except Exception as e:
        print("safe_feedback_base64_failed", {
            "language": language,
            "accent": accent,
            "text": text,
            "error": repr(e),
        })
        return ""