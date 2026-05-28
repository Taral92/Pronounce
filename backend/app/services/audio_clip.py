import base64
import os
import subprocess
import tempfile


PADDING_BEFORE = 0.12
PADDING_AFTER = 0.18


def to_base64(audio: bytes) -> str:
    return base64.b64encode(audio).decode("utf-8")


def clip_audio_bytes(audio_bytes: bytes, start: float, end: float, suffix: str = ".webm") -> bytes:
    start = max(0.0, start - PADDING_BEFORE)
    end = max(start + 0.08, end + PADDING_AFTER)

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as src:
        src.write(audio_bytes)
        src_path = src.name

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as out:
        out_path = out.name

    try:
        cmd = [
            "ffmpeg",
            "-y",
            "-i", src_path,
            "-ss", f"{start:.3f}",
            "-to", f"{end:.3f}",
            "-vn",
            "-acodec", "libmp3lame",
            out_path,
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        with open(out_path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(src_path):
            os.remove(src_path)
        if os.path.exists(out_path):
            os.remove(out_path)


def find_best_word_span(target_word: str, word_items: list[dict], used_indexes: set[int]) -> tuple[float, float] | None:
    normalized_target = (target_word or "").strip().lower()
    if not normalized_target:
        return None

    for idx, item in enumerate(word_items):
        token = str(item.get("word", "")).strip().lower()
        if idx in used_indexes:
            continue
        if token == normalized_target:
            start = item.get("start")
            end = item.get("end")
            if isinstance(start, (int, float)) and isinstance(end, (int, float)) and end > start:
                used_indexes.add(idx)
                return float(start), float(end)

    return None