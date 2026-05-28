"use client";
import type { LanguageConfig } from "@/types";

interface Props {
  languages: LanguageConfig[];
  selected: string;
  onChange: (lang: string) => void;
}

export default function LanguageTabs({ languages, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {languages.map(lang => (
        <button
          key={lang.key}
          onClick={() => onChange(lang.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all active:scale-95
            ${selected === lang.key
              ? "bg-purple-500 text-white shadow-md"
              : "bg-white border border-purple-200 text-purple-600 hover:border-purple-400 hover:bg-purple-50"
            }`}
        >
          <span className="text-base">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
