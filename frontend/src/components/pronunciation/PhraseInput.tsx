"use client";
interface Props {
  value: string;
  onChange: (v: string) => void;
  maxChars: number;
  language: string;
  disabled?: boolean;
}

const placeholders: Record<string, string> = {
  english: "e.g. The weather is beautiful today",
  german:  "z.B. Das Wetter ist heute wunderschön",
  spanish: "ej. El clima está hermoso hoy",
};

export default function PhraseInput({ value, onChange, maxChars, language, disabled }: Props) {
  const remaining = maxChars - value.length;
  const warn = remaining < 30;
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value.slice(0, maxChars))}
        disabled={disabled}
        placeholder={placeholders[language] ?? "Type a phrase to practise..."}
        rows={3}
        className="w-full resize-none rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none px-4 py-3 text-base font-medium text-gray-800 placeholder:text-gray-400 bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span className={`absolute bottom-3 right-4 text-xs font-semibold ${warn ? "text-red-400" : "text-gray-300"}`}>
        {remaining}
      </span>
    </div>
  );
}
