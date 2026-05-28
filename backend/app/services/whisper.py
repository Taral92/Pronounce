import io
import openai
from app.config import settings

_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribe(audio_bytes: bytes, language_code: str, filename: str = "recording.webm") -> dict:
    buf = io.BytesIO(audio_bytes)
    buf.name = filename

    result = await _client.audio.transcriptions.create(
        model=settings.WHISPER_MODEL,
        file=buf,
        language=language_code,
        response_format="verbose_json",
        timestamp_granularities=["word", "segment"],
    )

    data = result.model_dump() if hasattr(result, "model_dump") else dict(result)

    return {
        "text": (data.get("text") or "").strip(),
        "words": data.get("words", []) or [],
        "segments": data.get("segments", []) or [],
        "language": data.get("language", language_code),
    }