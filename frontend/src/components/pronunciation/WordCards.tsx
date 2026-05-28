"use client";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Volume2, Loader2 } from "lucide-react";
import { getWordTTS, getFeedbackTTS, base64ToObjectUrl } from "@/lib/api";
import type { PracticeWord } from "@/types";

interface Props {
  words: PracticeWord[];
  language: string;
  accent: string;
  phoneticsEnabled: boolean;
  wordTtsEnabled: boolean;
}

const severityStyles = {
  low: "border-amber-200 bg-amber-50",
  medium: "border-orange-200 bg-orange-50",
  high: "border-red-200 bg-red-50",
};

const severityDot = {
  low: "bg-amber-400",
  medium: "bg-orange-400",
  high: "bg-red-400",
};

const severityLabel = {
  low: "Almost there",
  medium: "Needs work",
  high: "Important fix",
};

function playBase64(base64: string) {
  const url = base64ToObjectUrl(base64);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.play();
}

export default function WordCards({
  words,
  language,
  accent,
  phoneticsEnabled,
  wordTtsEnabled,
}: Props) {
  const { getToken } = useAuth();
  const [loadingCorrect, setLoadingCorrect] = useState<string>("");
  const [loadingFeedback, setLoadingFeedback] = useState<string>("");

  const playCorrect = async (word: string) => {
    if (!wordTtsEnabled) return;
    setLoadingCorrect(word);
    try {
      const token = await getToken();
      if (!token) return;
      const b64 = await getWordTTS(token, word, language);
      playBase64(b64);
    } catch {
      // silent
    } finally {
      setLoadingCorrect("");
    }
  };

  const playFeedback = async (key: string, text: string) => {
    setLoadingFeedback(key);
    try {
      const token = await getToken();
      if (!token) return;
      const b64 = await getFeedbackTTS(token, text, language, accent);
      playBase64(b64);
    } catch {
      // silent
    } finally {
      setLoadingFeedback("");
    }
  };

  if (words.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
        Words to Practice
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {words.map((w, i) => {
          const feedbackText = `${w.what_to_fix}. Next time, ${w.next_try_tip}`;
          const feedbackKey = `${w.word}-${i}`;

          return (
            <div key={feedbackKey} className={`rounded-2xl border p-4 ${severityStyles[w.severity]}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${severityDot[w.severity]}`} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {severityLabel[w.severity]}
                  </span>
                </div>
              </div>

              <p className="text-base font-bold text-gray-800 mb-1">{w.word}</p>

              {phoneticsEnabled && w.phonetic && (
                <p className="text-xs text-gray-500 mb-1 font-mono">Correct: {w.phonetic}</p>
              )}

              {phoneticsEnabled && w.spoken && (
                <p className="text-xs text-red-500 mb-2 font-mono">You said: {w.spoken}</p>
              )}

              {w.what_was_good && (
                <p className="text-xs text-green-700 mb-2 leading-relaxed">✅ {w.what_was_good}</p>
              )}

              <p className="text-xs text-gray-700 mb-2 leading-relaxed">⚠️ {w.what_to_fix}</p>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">💡 {w.next_try_tip}</p>

              {w.parts && (
                <div className="mb-3 space-y-1">
                  {w.parts.start && <p className="text-[11px] text-gray-600"><span className="font-semibold">Start:</span> {w.parts.start}</p>}
                  {w.parts.middle && <p className="text-[11px] text-gray-600"><span className="font-semibold">Middle:</span> {w.parts.middle}</p>}
                  {w.parts.end && <p className="text-[11px] text-gray-600"><span className="font-semibold">End:</span> {w.parts.end}</p>}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {w.user_audio_base64 && (
                  <button
                    onClick={() => playBase64(w.user_audio_base64!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Volume2 size={11} /> Your word
                  </button>
                )}

                {wordTtsEnabled && (
                  <button
                    onClick={() => playCorrect(w.word)}
                    disabled={loadingCorrect === w.word}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
                  >
                    {loadingCorrect === w.word ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Volume2 size={11} />
                    )}
                    Correct pronunciation
                  </button>
                )}

                <button
                  onClick={() => playFeedback(feedbackKey, feedbackText)}
                  disabled={loadingFeedback === feedbackKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
                >
                  {loadingFeedback === feedbackKey ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Volume2 size={11} />
                  )}
                  Feedback
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}