"use client";

import type { UserLimits } from "@/types";
import Link from "next/link";

export default function UsageBadge({ limits }: { limits: UserLimits }) {
  if (limits.tier === "pro" || limits.tier === "admin") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
        <span>
          ✨ Pro Plan • Unlimited analyses • {limits.analyses_used} completed
        </span>
      </div>
    );
  }

  const rem = limits.analyses_remaining;
  if (rem === null) return null;

  const color =
    rem === 0
      ? "bg-red-100 text-red-600 border-red-200"
      : rem <= 2
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-purple-100 text-purple-600 border-purple-200";

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-2 text-sm font-semibold ${color}`}
    >
      <span>
        {rem === 0
          ? "No analyses left this month"
          : `${rem} analysis${rem === 1 ? "" : "es"} remaining`}
      </span>

      {rem <= 2 && (
        <Link
          href="/pricing"
          className="ml-3 font-bold underline underline-offset-2 hover:opacity-80"
        >
          Upgrade →
        </Link>
      )}
    </div>
  );
}