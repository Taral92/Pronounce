"use client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/lib/api";
import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    priceId: null,
    features: ["5 analyses per month", "3 welcome bonus analyses", "English, German & Spanish", "Word-by-word feedback", "Native audio playback"],
    cta: "Current plan",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    annual: { price: "$39", period: "/year", priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? "", savings: "Save $21" },
    features: ["Unlimited analyses", "All 3 accents per language", "60-second recordings", "IPA phonetics", "Word TTS buttons", "Priority support"],
    cta: "Upgrade to Pro",
    highlight: true,
  },
];

export default function PricingPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [annual, setAnnual] = useState(false);

  const handleCheckout = async (priceId: string | null, planName: string) => {
    if (!priceId) return;
    if (!isSignedIn) { router.push("/signup"); return; }
    setLoading(planName);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const url = await createCheckoutSession(token, priceId);
      window.location.href = url;
    } catch { setLoading(""); }
  };

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-purple-600">🎙️ Pronounce</Link>
          <Link href="/dashboard" className="btn-primary py-2 px-4 text-sm">Go to App</Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-4 pt-16 pb-4 text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-3">Simple pricing</h1>
        <p className="text-gray-500 mb-6">Start free. Upgrade when you're ready.</p>
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-2xl p-1 mb-10">
          <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${!annual ? "bg-white shadow text-purple-600" : "text-gray-500"}`}>Monthly</button>
          <button onClick={() => setAnnual(true)}  className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${annual  ? "bg-white shadow text-purple-600" : "text-gray-500"}`}>Annual <span className="text-green-500">-35%</span></button>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-2 gap-6">
          {plans.map(plan => {
            const priceId = annual && plan.annual ? plan.annual.priceId : plan.priceId;
            const displayPrice = annual && plan.annual ? plan.annual.price : plan.price;
            const displayPeriod = annual && plan.annual ? plan.annual.period : plan.period;
            return (
              <div key={plan.name} className={`card relative flex flex-col ${plan.highlight ? "ring-2 ring-purple-500" : ""}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
                )}
                {annual && plan.annual && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">{plan.annual.savings}</div>
                )}
                <h2 className="text-lg font-black text-gray-800 mb-1">{plan.name}</h2>
                <div className="mb-5">
                  <span className="text-4xl font-black text-gray-900">{displayPrice}</span>
                  <span className="text-gray-400 text-sm">{displayPeriod}</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={15} className="text-green-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(priceId, plan.name)}
                  disabled={!priceId || loading === plan.name}
                  className={`w-full py-3 rounded-2xl font-bold transition-all ${plan.highlight ? "btn-primary" : "btn-secondary"} disabled:opacity-50`}
                >
                  {loading === plan.name ? "Redirecting..." : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
