"use client";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function UpgradePrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap size={28} className="text-purple-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-2">You've used all your free analyses</h2>
        <p className="text-sm text-gray-500 mb-6">Upgrade to Pro for unlimited analyses, longer recordings, and all 3 accents.</p>
        <Link href="/pricing" className="btn-primary w-full block text-center mb-3">
          See Plans →
        </Link>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
          Maybe later
        </button>
      </div>
    </div>
  );
}
