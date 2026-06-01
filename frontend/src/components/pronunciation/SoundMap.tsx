"use client";

import { useMemo, useState } from "react";
import type { AnalyzedWordScore } from "@/types";

interface Props {
  words: AnalyzedWordScore[];
}

const tone = (score?: number) => {
  if (score == null) return "border-gray-200 bg-gray-50 text-gray-700";
  if (score >= 90) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 75) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
};

export default function SoundMap({ words }: Props) {
  const [selected, setSelected] = useState<AnalyzedWordScore | null>(words[0] ?? null);

  const weakest = useMemo(() => {
    return [...words]
      .filter((w) => typeof w.accuracy_score === "number")
      .sort((a, b) => (a.accuracy_score ?? 100) - (b.accuracy_score ?? 100))[0];
  }, [words]);

  if (!words.length) return null;

  return (
    <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Sound map</h3>
        <p className="mt-1 text-xs text-gray-500">
          Tap a word to see where this attempt was strong and where the sound broke down.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {words.map((word, i) => {
          const active = selected?.word === word.word && selected?.offset === word.offset;

          return (
            <button
              key={`${word.word}-${word.offset ?? i}`}
              type="button"
              onClick={() => setSelected(word)}
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${tone(
                word.accuracy_score
              )} ${active ? "ring-2 ring-purple-300" : ""}`}
            >
              {word.word}
              {typeof word.accuracy_score === "number" && (
                <span className="ml-2 text-xs opacity-80">{Math.round(word.accuracy_score)}</span>
              )}
            </button>
          );
        })}
      </div>

      {weakest && (
        <div className="rounded-2xl bg-purple-50 px-4 py-3 text-sm text-purple-800">
          Lowest-scoring word in this attempt:{" "}
          <span className="font-bold">{weakest.word}</span>
          {typeof weakest.accuracy_score === "number"
            ? ` (${Math.round(weakest.accuracy_score)}/100)`
            : ""}
        </div>
      )}

      {selected && <SoundMapDetail word={selected} />}
    </div>
  );
}

function SoundMapDetail({ word }: { word: AnalyzedWordScore }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-4">
        <p className="text-lg font-bold text-gray-900">{word.word}</p>
        <p className="text-xs text-gray-500">
          Word accuracy:{" "}
          {typeof word.accuracy_score === "number" ? Math.round(word.accuracy_score) : "—"}
        </p>
      </div>

      {!!word.syllables.length && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Syllable breakdown
          </p>
          <div className="flex flex-wrap gap-2">
            {word.syllables.map((s, i) => (
              <div
                key={`${s.syllable}-${i}`}
                className={`rounded-2xl border px-3 py-2 ${tone(s.accuracy_score)}`}
              >
                <p className="text-sm font-semibold">{s.grapheme || s.syllable}</p>
                <p className="text-[11px] opacity-75">
                  {typeof s.accuracy_score === "number" ? Math.round(s.accuracy_score) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!word.phonemes.length && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Phoneme detail
          </p>
          <div className="flex flex-wrap gap-2">
            {word.phonemes.map((p, i) => (
              <div
                key={`${p.phoneme}-${i}`}
                className={`min-w-[64px] rounded-2xl border px-3 py-2 text-center ${tone(
                  p.accuracy_score
                )}`}
              >
                <p className="font-mono text-sm font-bold">/{p.phoneme}/</p>
                <p className="text-[11px] opacity-75">
                  {typeof p.accuracy_score === "number" ? Math.round(p.accuracy_score) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}