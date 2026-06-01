"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number;
  secondaryScore?: number;
  size?: number;
}

const scoreColor = (s: number) =>
  s >= 85 ? "#16a34a" : s >= 70 ? "#f59e0b" : "#ef4444";

const scoreLabel = (s: number) =>
  s >= 90 ? "Excellent" : s >= 75 ? "Strong" : s >= 60 ? "Good base" : s >= 40 ? "Needs polish" : "Needs support";

export default function ScoreCircle({ score, secondaryScore, size = 152 }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const rOuter = size / 2 - 12;
  const rInner = size / 2 - 26;
  const circOuter = 2 * Math.PI * rOuter;
  const circInner = 2 * Math.PI * rInner;

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

  const outerOffset = circOuter - (displayed / 100) * circOuter;
  const innerOffset = circInner - ((secondaryScore ?? 0) / 100) * circInner;
  const outerColor = scoreColor(score);
  const innerColor = secondaryScore != null ? scoreColor(secondaryScore) : "#d8b4fe";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={rOuter} fill="none" stroke="#ede9fe" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={rOuter}
          fill="none"
          stroke={outerColor}
          strokeWidth={10}
          strokeDasharray={circOuter}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.05s linear" }}
        />

        {secondaryScore != null && (
          <>
            <circle cx={size / 2} cy={size / 2} r={rInner} fill="none" stroke="#f3f4f6" strokeWidth={6} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={rInner}
              fill="none"
              stroke={innerColor}
              strokeWidth={6}
              strokeDasharray={circInner}
              strokeDashoffset={innerOffset}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.3s ease" }}
            />
          </>
        )}

        <text
          x="50%"
          y="46%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ fontWeight: 800, fontSize: size * 0.22, fill: outerColor }}
        >
          {displayed}
        </text>
        <text
          x="50%"
          y="62%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ fontSize: size * 0.1, fill: "#9ca3af" }}
        >
          / 100
        </text>
      </svg>

      <p className="text-sm font-semibold" style={{ color: outerColor }}>{scoreLabel(score)}</p>
      {secondaryScore != null && (
        <p className="text-xs text-gray-500">Inner ring: pronunciation score {secondaryScore}</p>
      )}
    </div>
  );
}