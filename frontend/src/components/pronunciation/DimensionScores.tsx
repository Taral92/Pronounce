"use client";

import type { DimensionScore } from "@/types";

interface Props {
  dimensions: Record<string, DimensionScore>;
}

const icons: Record<string, string> = {
  sounds: "🔤",
  rhythm: "🎵",
  stress: "📢",
  pitch: "📊",
};

const labels: Record<string, string> = {
  sounds: "Sounds",
  rhythm: "Rhythm",
  stress: "Stress",
  pitch: "Pitch",
};

const barColor = (score?: number) =>
  score == null ? "#a78bfa" : score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

export default function DimensionScores({ dimensions }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(dimensions).map(([key, dim]) => (
        <div
          key={key}
          className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {icons[key] ?? "•"} {labels[key] ?? key}
            </span>

            {dim.score != null ? (
              <span
                className="text-lg font-extrabold"
                style={{ color: barColor(dim.score) }}
              >
                {dim.score}
              </span>
            ) : (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-sm font-bold text-purple-600">
                {dim.label}
              </span>
            )}
          </div>

          {dim.score != null && (
            <div className="mb-2 h-1.5 w-full rounded-full bg-purple-100">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${dim.score}%`,
                  backgroundColor: barColor(dim.score),
                }}
              />
            </div>
          )}

          <p className="text-xs leading-relaxed text-gray-500">{dim.feedback}</p>
        </div>
      ))}
    </div>
  );
}