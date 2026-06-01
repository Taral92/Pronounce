import json
import os
import tempfile

import azure.cognitiveservices.speech as speechsdk

from app.config import settings


def assess_pronunciation(audio_path: str, reference_text: str):
    speech_config = speechsdk.SpeechConfig(
        subscription=settings.AZURE_SPEECH_KEY,
        region=settings.AZURE_SPEECH_REGION,
    )

    audio_config = speechsdk.audio.AudioConfig(filename=audio_path)

    pronunciation_config = speechsdk.PronunciationAssessmentConfig(
        reference_text=reference_text,
        grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
        enable_miscue=True,
    )

    recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config,
        audio_config=audio_config,
    )

    pronunciation_config.apply_to(recognizer)

    result = recognizer.recognize_once()

    raw = result.properties.get(
        speechsdk.PropertyId.SpeechServiceResponse_JsonResult
    )
    data = json.loads(raw)

    nbest = (data.get("NBest") or [{}])[0]

    pa = nbest.get("PronunciationAssessment", {})

    return {
        "recognized_text": nbest.get("Display", ""),
        "pronunciation_score": pa.get("PronScore"),
        "accuracy_score": pa.get("AccuracyScore"),
        "fluency_score": pa.get("FluencyScore"),
        "completeness_score": pa.get("CompletenessScore"),
        "prosody_score": pa.get("ProsodyScore"),
        "raw": data,
    }