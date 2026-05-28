"use client";
import { useEffect, useState } from "react";

interface Props { score: number; size?: number; }

const scoreColor = (s: number) =>
  s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";

const scoreLabel = (s: number) =>
  s >= 90 ? "Excellent! 🎉" : s >= 80 ? "Great job! 👏" : s >= 60 ? "Good effort 💪" : s >= 40 ? "Keep practising 📚" : "Needs work 🔄";

export default function ScoreCircle({ score, size = 140 }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const r = (size / 2) - 12;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    let frame: number;
    let current = 0;
    const step = () => {
      current = Math.min(current + 2, score);
      setDisplayed(current);
      if (current < score) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = circ - (displayed / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="drop-shadow-md">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e9d5ff" strokeWidth={10} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.05s linear" }}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: size * 0.22, fill: color }}>
          {displayed}
        </text>
        <text x="50%" y="68%" dominantBaseline="middle" textAnchor="middle"
          style={{ fontFamily: "Nunito, sans-serif", fontSize: size * 0.12, fill: "#9ca3af" }}>
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold" style={{ color }}>{scoreLabel(score)}</p>
    </div>
  );
}
