from app.services import whisper
from app.services.azure_speech import assess_pronunciation

import tempfile
import subprocess
import os


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(str(value).split()).strip()
    return cleaned or None


async def assess(
    audio_bytes: bytes,
    language_code: str,
    reference_text: str | None,
    filename: str,
):
    print("REFERENCE TEXT:", reference_text)

    transcription = await whisper.transcribe(
        audio_bytes,
        language_code,
        filename,
    )

    transcript_text = _clean_text((transcription or {}).get("text"))
    effective_reference = _clean_text(reference_text) or transcript_text

    print("TRANSCRIPT TEXT:", transcript_text)
    print("EFFECTIVE REFERENCE:", effective_reference)

    azure = None

    if effective_reference:
        print("RUNNING AZURE ASSESSMENT")

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

            print("WAV CREATED:", wav_path)

            azure = assess_pronunciation(
                wav_path,
                effective_reference,
            )

            print("AZURE RESULT:", azure)

        except Exception as e:
            print("AZURE ERROR:", repr(e))
            azure = None

        finally:
            if os.path.exists(src_path):
                os.remove(src_path)

            if os.path.exists(wav_path):
                os.remove(wav_path)

    return {
        "transcription": transcription,
        "assessment": azure,
    }