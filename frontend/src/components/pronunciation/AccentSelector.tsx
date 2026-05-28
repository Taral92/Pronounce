"use client";
import type { LanguageConfig } from "@/types";

interface Props {
  language: LanguageConfig;
  selected: string;
  onChange: (accent: string) => void;
}

export default function AccentSelector({ language, selected, onChange }: Props) {
  const accents = Object.entries(language.accents);
  if (accents.length <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Accent</span>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className="text-sm font-semibold text-purple-700 bg-white border border-purple-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
      >
        {accents.map(([key, acc]) => (
          <option key={key} value={key}>{acc.label}</option>
        ))}
      </select>
    </div>
  );
}
