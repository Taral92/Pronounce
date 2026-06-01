from app.services import whisper
from app.services.azure_speech import assess_pronunciation

import tempfile
import subprocess
import os


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

    azure = None

    if reference_text:
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
                reference_text,
            )

            print("AZURE RESULT:", azure)

        except Exception as e:
            print("AZURE ERROR:", repr(e))
            raise

        finally:
            if os.path.exists(src_path):
                os.remove(src_path)

            if os.path.exists(wav_path):
                os.remove(wav_path)

    return {
        "transcription": transcription,
        "assessment": azure,
    }


