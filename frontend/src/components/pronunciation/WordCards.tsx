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
  low: "Polish this",
  medium: "Fix this",
  high: "Priority fix",
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
    } finally {
      setLoadingFeedback("");
    }
  };

  if (words.length === 0) return null;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Your highest-impact fixes
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Practice these first to sound clearer faster.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {words.map((w, i) => {
          const feedbackText = `${w.what_to_fix}. Next time, ${w.next_try_tip}`;
          const feedbackKey = `${w.word}-${i}`;
          const userAudio = w.user_audio_base64;

          return (
            <div
              key={feedbackKey}
              className={`rounded-2xl border p-4 ${severityStyles[w.severity]}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${severityDot[w.severity]}`} />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    {severityLabel[w.severity]}
                  </span>
                </div>
              </div>

              <p className="mb-1 text-base font-bold text-gray-800">{w.word}</p>

              {phoneticsEnabled && w.phonetic && (
                <p className="mb-1 font-mono text-xs text-gray-500">
                  Target sound: {w.phonetic}
                </p>
              )}

              {phoneticsEnabled && w.spoken && (
                <p className="mb-2 font-mono text-xs text-red-500">
                  Heard as: {w.spoken}
                </p>
              )}

              {w.what_was_good && (
                <p className="mb-2 text-xs leading-relaxed text-green-700">
                  ✅ {w.what_was_good}
                </p>
              )}

              <p className="mb-2 text-xs leading-relaxed text-gray-700">
                <span className="font-semibold">What to fix:</span> {w.what_to_fix}
              </p>

              <p className="mb-3 text-xs leading-relaxed text-gray-600">
                <span className="font-semibold">Next try:</span> {w.next_try_tip}
              </p>

              {w.parts && (
                <div className="mb-3 space-y-1">
                  {w.parts.start && (
                    <p className="text-[11px] text-gray-600">
                      <span className="font-semibold">Start:</span> {w.parts.start}
                    </p>
                  )}
                  {w.parts.middle && (
                    <p className="text-[11px] text-gray-600">
                      <span className="font-semibold">Middle:</span> {w.parts.middle}
                    </p>
                  )}
                  {w.parts.end && (
                    <p className="text-[11px] text-gray-600">
                      <span className="font-semibold">End:</span> {w.parts.end}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {userAudio && (
                  <button
                    onClick={() => playBase64(userAudio)}
                    className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all active:scale-95 hover:bg-gray-50"
                  >
                    <Volume2 size={11} />
                    Your audio
                  </button>
                )}

                {wordTtsEnabled && (
                  <button
                    onClick={() => playCorrect(w.word)}
                    disabled={loadingCorrect === w.word}
                    className="flex items-center gap-1.5 rounded-full bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 hover:bg-purple-600 disabled:opacity-60"
                  >
                    {loadingCorrect === w.word ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Volume2 size={11} />
                    )}
                    Target audio
                  </button>
                )}

                <button
                  onClick={() => playFeedback(feedbackKey, feedbackText)}
                  disabled={loadingFeedback === feedbackKey}
                  className="flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 hover:bg-black disabled:opacity-60"
                >
                  {loadingFeedback === feedbackKey ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Volume2 size={11} />
                  )}
                  Coach tip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}