import base64
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

async def _synthesize(voice_id: str, text: str, model: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {"text": text, "model_id": model, "voice_settings": _VOICE_SETTINGS}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=_HEADERS)
        resp.raise_for_status()
        return resp.content

async def phrase(text: str, language: str, accent: str) -> bytes:
    lang = LANGUAGES.get(language, LANGUAGES["english"])
    accent_cfg = lang["accents"].get(accent, list(lang["accents"].values())[0])
    return await _synthesize(accent_cfg["voice_id"], text, settings.ELEVENLABS_PHRASE_MODEL)

async def word(text: str, language: str) -> bytes:
    lang = LANGUAGES.get(language, LANGUAGES["english"])
    return await _synthesize(lang["word_voice_id"], text, settings.ELEVENLABS_WORD_MODEL)

async def feedback(text: str, language: str, accent: str | None = None) -> bytes:
    lang = LANGUAGES.get(language, LANGUAGES["english"])
    if accent and accent in lang["accents"]:
        voice_id = lang["accents"][accent]["voice_id"]
    else:
        voice_id = list(lang["accents"].values())[0]["voice_id"]
    return await _synthesize(voice_id, text, settings.ELEVENLABS_PHRASE_MODEL)

def to_base64(audio: bytes) -> str:
    return base64.b64encode(audio).decode("utf-8")

async def safe_word_base64(text: str, language: str) -> str:
    try:
        audio = await word(text, language)
        return to_base64(audio)
    except Exception:
        return ""

async def safe_feedback_base64(text: str, language: str, accent: str | None = None) -> str:
    try:
        audio = await feedback(text, language, accent)
        return to_base64(audio)
    except Exception:
        return ""