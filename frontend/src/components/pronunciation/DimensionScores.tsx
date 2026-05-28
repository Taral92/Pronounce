"use client";
import type { DimensionScore } from "@/types";

interface Props { dimensions: Record<string, DimensionScore>; }

const icons: Record<string, string> = {
  sounds: "🔤", rhythm: "🎵", stress: "📢", pitch: "📊",
};
const labels: Record<string, string> = {
  sounds: "Sounds", rhythm: "Rhythm", stress: "Stress", pitch: "Pitch",
};

const barColor = (score?: number) =>
  !score ? "#a78bfa" : score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

export default function DimensionScores({ dimensions }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(dimensions).map(([key, dim]) => (
        <div key={key} className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {icons[key] ?? "•"} {labels[key] ?? key}
            </span>
            {dim.score != null ? (
              <span className="text-lg font-extrabold" style={{ color: barColor(dim.score) }}>
                {dim.score}
              </span>
            ) : (
              <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                {dim.label}
              </span>
            )}
          </div>
          {dim.score != null && (
            <div className="w-full h-1.5 bg-purple-100 rounded-full mb-2">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${dim.score}%`, backgroundColor: barColor(dim.score) }}
              />
            </div>
          )}
          <p className="text-xs text-gray-500 leading-relaxed">{dim.feedback}</p>
        </div>
      ))}
    </div>
  );
}
