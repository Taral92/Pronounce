"use client";
interface Props { feedback: string[]; nativeComparison: string; }

export default function FeedbackPanel({ feedback, nativeComparison }: Props) {
  return (
    <div className="bg-purple-50 rounded-2xl border border-purple-100 p-4">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">💬 Coach Feedback</h3>
      {nativeComparison && (
        <p className="text-sm text-purple-700 font-semibold mb-3 pb-3 border-b border-purple-100">
          {nativeComparison}
        </p>
      )}
      <ul className="space-y-2">
        {feedback.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-0.5 text-purple-400 font-bold">→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
