"use client";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Copy, Check, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function TutorDashboardPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/tutor/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, [getToken]);

  const copyLink = () => {
    navigator.clipboard.writeText(data?.ref_link as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 font-semibold animate-pulse">Loading your stats...</p></div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-400 font-semibold">{(data?.error as string) ?? "Access denied"}</p></div>;

  const tutor = data.tutor as Record<string, unknown>;
  const monthly = (data.monthly_breakdown as Record<string, unknown>[]) ?? [];

  const kpis = [
    { label: "Total Signups", value: data.total_signups, icon: <Users size={20}/>, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Subscribed", value: data.subscribed, icon: <TrendingUp size={20}/>, color: "text-green-500", bg: "bg-green-50" },
    { label: "Pending Payout", value: `$${data.pending_payout}`, icon: <DollarSign size={20}/>, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Total Earned", value: `$${(Number(data.pending_payout) + Number(data.total_paid)).toFixed(2)}`, icon: <DollarSign size={20}/>, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-black text-purple-600">🎙️ Pronounce</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Tutor Portal</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="card">
          <h1 className="text-xl font-black text-gray-800 mb-1">Hi {tutor.name as string} 👋</h1>
          <p className="text-sm text-gray-500 mb-4">Here's your referral performance this month.</p>
          <div className="bg-purple-50 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Your Referral Link</p>
              <p className="text-sm font-bold text-purple-700 break-all">{data.ref_link as string}</p>
            </div>
            <button onClick={copyLink} className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white text-sm font-bold rounded-2xl hover:bg-purple-600 transition-all active:scale-95 shrink-0">
              {copied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy Link</>}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="card flex items-center gap-3">
              <div className={`w-10 h-10 ${k.bg} ${k.color} rounded-2xl flex items-center justify-center shrink-0`}>{k.icon}</div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-black text-gray-800">{k.value as string}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Breakdown */}
        {monthly.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Calendar size={14}/> Monthly Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 pr-4">Month</th><th className="pb-2 pr-4">Subscriptions</th><th className="pb-2 pr-4">Earned</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>
                  {monthly.map((m: Record<string, unknown>, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-4 font-semibold text-gray-700">{m.month as string}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{m.count as number}</td>
                      <td className="py-2.5 pr-4 font-bold text-green-600">${m.earned as number}</td>
                      <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.status === "paid" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>{m.status as string}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">Commission rate: {tutor.commission_pct as number}% · Payments processed monthly by Pronounce team</p>
      </main>
    </div>
  );
}
