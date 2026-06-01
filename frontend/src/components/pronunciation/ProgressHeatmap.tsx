"use client";

const demo = [
  0, 1, 2, 0, 3, 2, 1,
  0, 0, 1, 2, 3, 2, 1,
  1, 2, 0, 0, 3, 3, 2,
  0, 1, 1, 2, 0, 1, 3,
];

const cellTone = (v: number) => {
  if (v === 0) return "bg-gray-100";
  if (v === 1) return "bg-purple-200";
  if (v === 2) return "bg-purple-400";
  return "bg-purple-600";
};

export default function ProgressHeatmap() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Practice rhythm</h3>
        <p className="mt-1 text-xs text-gray-500">A heatmap-style streak view can make practice feel alive and sticky.</p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {demo.map((v, i) => (
          <div
            key={i}
            className={`aspect-square rounded-md ${cellTone(v)}`}
            title={`Day ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}