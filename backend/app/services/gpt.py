import json
import openai
from app.config import settings

_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

_SYSTEM = """\
You are an expert multilingual pronunciation coach with deep knowledge of phonetics, prosody, and linguistics.

You will receive:
- mode: "guided" or "free"
- intended: target phrase if guided mode, else null
- transcribed: what the learner actually said
- language
- accent
- words: transcript word timing metadata

Return ONLY valid JSON in this exact shape:

{
  "overall_score": <0-100>,
  "overall_feedback": "<short practical summary>",
  "practice_words": [
    {
      "word": "<target word needing practice>",
      "spoken": "<what learner likely said or null>",
      "phonetic": "<correct IPA or null>",
      "severity": "<low|medium|high>",
      "what_was_good": "<brief positive note or null>",
      "what_to_fix": "<specific issue>",
      "next_try_tip": "<short instruction for next attempt>",
      "parts": {
        "start": "<what happened at start or null>",
        "middle": "<what happened in middle or null>",
        "end": "<what happened at end or null>"
      }
    }
  ]
}

Rules:
- Include words that need practice, including almost-correct ones if there is a useful correction.
- Do not include fully correct words.
- Keep feedback concrete and short.
- In guided mode, compare intended phrase to transcript.
- In free mode, evaluate words in the transcript that likely need pronunciation work.
- Severity low means almost correct but worth coaching.
"""

async def analyze(mode: str, intended: str | None, transcribed: dict, language: str, accent: str) -> dict:
    payload = {
        "mode": mode,
        "intended": intended,
        "transcribed": transcribed.get("text", ""),
        "language": language,
        "accent": accent,
        "words": transcribed.get("words", []),
    }

    resp = await _client.chat.completions.create(
        model=settings.GPT_ANALYSIS_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
        max_tokens=1600,
    )

    content = resp.choices[0].message.content or "{}"
    data = json.loads(content)
    data.setdefault("overall_score", 0)
    data.setdefault("overall_feedback", "")
    data.setdefault("practice_words", [])
    return data