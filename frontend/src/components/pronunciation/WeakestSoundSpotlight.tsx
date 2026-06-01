"use client";

import type { AnalyzedWordScore } from "@/types";

interface Props {
  words: AnalyzedWordScore[];
}

function findWeakest(words: AnalyzedWordScore[]) {
  let weakestWord: AnalyzedWordScore | null = null;
  let weakestPhoneme: { phoneme: string; score?: number; word: string } | null = null;

  for (const word of words) {
    if (
      typeof word.accuracy_score === "number" &&
      (!weakestWord || (word.accuracy_score ?? 100) < (weakestWord.accuracy_score ?? 100))
    ) {
      weakestWord = word;
    }

    for (const phoneme of word.phonemes ?? []) {
      if (
        typeof phoneme.accuracy_score === "number" &&
        (!weakestPhoneme || (phoneme.accuracy_score ?? 100) < (weakestPhoneme.score ?? 100))
      ) {
        weakestPhoneme = {
          phoneme: phoneme.phoneme,
          score: phoneme.accuracy_score,
          word: word.word,
        };
      }
    }
  }

  return { weakestWord, weakestPhoneme };
}

export default function WeakestSoundSpotlight({ words }: Props) {
  if (!words.length) return null;

  const { weakestWord, weakestPhoneme } = findWeakest(words);
  if (!weakestWord && !weakestPhoneme) return null;

  return (
    <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-rose-600">
          Weakest sound spotlight
        </h3>
        <p className="mt-1 text-xs text-rose-500">
          The biggest opportunity in this attempt, based on your detailed sound analysis.
        </p>
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        {weakestPhoneme && (
          <p>
            Lowest phoneme: <span className="font-bold text-gray-900">/{weakestPhoneme.phoneme}/</span>{" "}
            in <span className="font-bold text-gray-900">{weakestPhoneme.word}</span>
            {typeof weakestPhoneme.score === "number" ? ` (${Math.round(weakestPhoneme.score)}/100)` : ""}
          </p>
        )}

        {weakestWord && (
          <p>
            Lowest word score: <span className="font-bold text-gray-900">{weakestWord.word}</span>
            {typeof weakestWord.accuracy_score === "number"
              ? ` (${Math.round(weakestWord.accuracy_score)}/100)`
              : ""}
          </p>
        )}
      </div>
    </div>
  );
}