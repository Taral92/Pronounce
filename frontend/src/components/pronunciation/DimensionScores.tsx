"use client";

interface Props {
  scores: {
    pronunciation_score?: number;
    accuracy_score?: number;
    fluency_score?: number;
    prosody_score?: number;
    completeness_score?: number;
  };
}

const ITEMS = [
  { key: "pronunciation_score", label: "Pronunciation", hint: "Overall sound quality and clarity." },
  { key: "accuracy_score", label: "Accuracy", hint: "How closely your sounds matched the target." },
  { key: "fluency_score", label: "Fluency", hint: "Smoothness, pacing, and flow." },
  { key: "completeness_score", label: "Completeness", hint: "Whether key words were fully said." },
  { key: "prosody_score", label: "Prosody", hint: "Rhythm, stress, and intonation." },
] as const;

const tone = (score?: number) => {
  if (score == null) return { bar: "bg-purple-300", text: "text-purple-600", chip: "bg-purple-50" };
  if (score >= 85) return { bar: "bg-green-500", text: "text-green-600", chip: "bg-green-50" };
  if (score >= 70) return { bar: "bg-amber-500", text: "text-amber-600", chip: "bg-amber-50" };
  return { bar: "bg-red-500", text: "text-red-600", chip: "bg-red-50" };
};

export default function DimensionScores({ scores }: Props) {
  const visible = ITEMS.filter(({ key }) => scores[key] != null);
  if (!visible.length) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Score breakdown</h3>
        <p className="mt-1 text-xs text-gray-500">Detailed speaking metrics from the speech assessment engine.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map(({ key, label, hint }) => {
          const value = scores[key];
          const styles = tone(value);

          return (
            <div key={key} className={`rounded-2xl border border-gray-200 p-4 ${styles.chip}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-[11px] leading-relaxed text-gray-500">{hint}</p>
                </div>
                <span className={`text-lg font-extrabold ${styles.text}`}>{value}</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/80">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${styles.bar}`}
                  style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}