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
    features: [
      "5 analyses per month",
      "3 welcome bonus analyses",
      "English, German & Spanish",
      "Word-by-word feedback",
      "Native audio playback",
    ],
    cta: "Current plan",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    annual: {
      price: "$39",
      period: "/year",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
      savings: "Save $21",
    },
    features: [
      "Unlimited analyses",
      "All 3 accents per language",
      "60-second recordings",
      "IPA phonetics",
      "Word TTS buttons",
      "Priority support",
    ],
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

    if (!isSignedIn) {
      router.push("/signup");
      return;
    }

    setLoading(planName);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const result = await createCheckoutSession(token, priceId);
      if (!result.url) throw new Error("No checkout URL returned");

      window.location.href = result.url;
    } catch (error) {
      console.error("Checkout failed:", error);
      setLoading("");
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-purple-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-black text-purple-600">
            🎙️ Pronounce
          </Link>
          <Link href="/dashboard" className="btn-primary px-4 py-2 text-sm">
            Go to App
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 pb-4 pt-16 text-center">
        <h1 className="mb-3 text-4xl font-black text-gray-900">Simple pricing</h1>
        <p className="mb-6 text-gray-500">Start free. Upgrade when you&apos;re ready.</p>

        <div className="mb-10 inline-flex items-center gap-2 rounded-2xl bg-gray-100 p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-xl px-4 py-1.5 text-sm font-bold transition-all ${
              !annual ? "bg-white text-purple-600 shadow" : "text-gray-500"
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => setAnnual(true)}
            className={`rounded-xl px-4 py-1.5 text-sm font-bold transition-all ${
              annual ? "bg-white text-purple-600 shadow" : "text-gray-500"
            }`}
          >
            Annual <span className="text-green-500">-35%</span>
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => {
            const priceId = annual && "annual" in plan && plan.annual ? plan.annual.priceId : plan.priceId;
            const displayPrice = annual && "annual" in plan && plan.annual ? plan.annual.price : plan.price;
            const displayPeriod = annual && "annual" in plan && plan.annual ? plan.annual.period : plan.period;

            return (
              <div
                key={plan.name}
                className={`card relative flex flex-col ${plan.highlight ? "ring-2 ring-purple-500" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}

                {annual && "annual" in plan && plan.annual && (
                  <div className="absolute -top-3 right-4 rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white">
                    {plan.annual.savings}
                  </div>
                )}

                <h2 className="mb-1 text-lg font-black text-gray-800">{plan.name}</h2>

                <div className="mb-5">
                  <span className="text-4xl font-black text-gray-900">{displayPrice}</span>
                  <span className="text-sm text-gray-400">{displayPeriod}</span>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={15} className="shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(priceId, plan.name)}
                  disabled={!priceId || loading === plan.name}
                  className={`w-full rounded-2xl py-3 font-bold transition-all ${
                    plan.highlight ? "btn-primary" : "btn-secondary"
                  } disabled:opacity-50`}
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