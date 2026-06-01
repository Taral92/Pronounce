"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  feedback: string;
}

export default function FeedbackPanel({ feedback }: Props) {
  const [open, setOpen] = useState(false);
  if (!feedback?.trim()) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Coach notes</h3>
          <p className="mt-1 text-xs text-gray-500">Open for the full written summary and practice focus.</p>
        </div>
        <span className="rounded-full bg-gray-100 p-2 text-gray-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="mt-4 rounded-2xl bg-purple-50 px-4 py-3 text-sm leading-relaxed text-gray-700">
          {feedback}
        </div>
      )}
    </div>
  );
}