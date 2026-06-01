"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Volume2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
  low: {
    card: "border-amber-200 bg-amber-50/70",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-400",
    label: "Polish this",
  },
  medium: {
    card: "border-orange-200 bg-orange-50/70",
    badge: "bg-orange-100 text-orange-800",
    dot: "bg-orange-400",
    label: "Fix this",
  },
  high: {
    card: "border-red-200 bg-red-50/70",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-400",
    label: "Priority fix",
  },
} as const;

function playBase64(base64: string) {
  const url = base64ToObjectUrl(base64);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => {
    console.error("playBase64 failed");
    URL.revokeObjectURL(url);
  };
  audio.play().catch((e) => {
    console.error("audio.play failed", e);
    URL.revokeObjectURL(url);
  });
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  console.log("WordCards props", {
    wordTtsEnabled,
    phoneticsEnabled,
    language,
    accent,
    wordsCount: words.length,
  });

  const playCorrect = async (word: string) => {
    if (!wordTtsEnabled) return;

    setLoadingCorrect(word);
    try {
      const token = await getToken();
      if (!token) {
        console.error("playCorrect failed: missing token");
        return;
      }

      const b64 = await getWordTTS(token, word, language);
      console.log("getWordTTS success", { word, length: b64?.length ?? 0 });

      if (!b64) {
        console.error("getWordTTS returned empty base64", { word, language });
        return;
      }

      playBase64(b64);
    } catch (e) {
      console.error("playCorrect failed", e);
    } finally {
      setLoadingCorrect("");
    }
  };

  const playFeedback = async (key: string, text: string) => {
    setLoadingFeedback(key);
    try {
      const token = await getToken();
      if (!token) {
        console.error("playFeedback failed: missing token");
        return;
      }

      const b64 = await getFeedbackTTS(token, text, language, accent);
      console.log("getFeedbackTTS success", { key, length: b64?.length ?? 0 });

      if (!b64) {
        console.error("getFeedbackTTS returned empty base64", { key, language, accent });
        return;
      }

      playBase64(b64);
    } catch (e) {
      console.error("playFeedback failed", e);
    } finally {
      setLoadingFeedback("");
    }
  };

  if (!words.length) return null;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Your highest-impact fixes
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Practice these first to improve clarity fastest without getting overloaded.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {words.map((w, i) => {
          const styles = severityStyles[w.severity];
          const feedbackText = `${w.what_to_fix}. Next time, ${w.next_try_tip}`;
          const key = `${w.word}-${i}`;
          const isExpanded = !!expanded[key];
          const hasParts = Boolean(w.parts?.start || w.parts?.middle || w.parts?.end);

          return (
            <article key={key} className={`rounded-3xl border p-4 shadow-sm ${styles.card}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles.badge}`}>
                      {styles.label}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{w.word}</h4>
                  {phoneticsEnabled && w.phonetic && (
                    <p className="mt-1 font-mono text-xs text-gray-500">
                      Target pronunciation: {w.phonetic}
                    </p>
                  )}
                </div>
              </div>

              {phoneticsEnabled && w.spoken && (
                <p className="mb-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-medium text-red-600">
                  Heard as: {w.spoken}
                </p>
              )}

              {w.what_was_good && (
                <p className="mb-2 text-xs leading-relaxed text-green-700">
                  <span className="font-semibold">What was good:</span> {w.what_was_good}
                </p>
              )}

              <p className="mb-2 text-sm leading-relaxed text-gray-800">
                <span className="font-semibold">What to fix:</span> {w.what_to_fix}
              </p>

              <p className="mb-3 text-sm leading-relaxed text-gray-600">
                <span className="font-semibold">Next try:</span> {w.next_try_tip}
              </p>

              {hasParts && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? "Hide sound breakdown" : "Show sound breakdown"}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 rounded-2xl bg-white/80 p-3">
                      {w.parts?.start && (
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Start:</span> {w.parts.start}
                        </p>
                      )}
                      {w.parts?.middle && (
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Middle:</span> {w.parts.middle}
                        </p>
                      )}
                      {w.parts?.end && (
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">End:</span> {w.parts.end}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {w.user_audio_base64 && (
                  <button
                    type="button"
                    onClick={() => playBase64(w.user_audio_base64!)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95"
                  >
                    <Volume2 size={12} /> You
                  </button>
                )}

                {wordTtsEnabled && (
                  <button
                    type="button"
                    onClick={() => playCorrect(w.word)}
                    disabled={loadingCorrect === w.word}
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                  >
                    {loadingCorrect === w.word ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Volume2 size={12} />
                    )}
                    Native
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => playFeedback(key, feedbackText)}
                  disabled={loadingFeedback === key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  {loadingFeedback === key ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Volume2 size={12} />
                  )}
                  Coach tip
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}