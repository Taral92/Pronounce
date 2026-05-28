"use client";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Users, DollarSign, TrendingUp, Plus, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function api(token: string, path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function AdminPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<"overview" | "commissions" | "add">("overview");
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [tutors, setTutors] = useState<Record<string, unknown>[]>([]);
  const [commissions, setCommissions] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ name: "", email: "", ref_code: "", commission_pct: "20", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const [s, t, c] = await Promise.all([
        api(token, "/admin/stats"),
        api(token, "/admin/tutors"),
        api(token, "/admin/commissions"),
      ]);
      setStats(s); setTutors(t); setCommissions(c);
    })();
  }, [getToken]);

  const addTutor = async () => {
    setSaving(true);
    const token = await getToken();
    if (!token) return;
    await api(token, "/admin/tutors", "POST", { ...form, commission_pct: parseFloat(form.commission_pct) });
    const t = await api(token, "/admin/tutors");
    setTutors(t); setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    setForm({ name: "", email: "", ref_code: "", commission_pct: "20", notes: "" });
  };

  const toggleStatus = async (id: string, current: string) => {
    const token = await getToken();
    if (!token) return;
    await api(token, `/admin/tutors/${id}`, "PUT", { status: current === "active" ? "paused" : "active" });
    setTutors(await api(token, "/admin/tutors"));
  };

  const markPaid = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    await api(token, `/admin/commissions/${id}/pay`, "PUT");
    setCommissions(await api(token, "/admin/commissions"));
  };

  const kpis = stats ? [
    { label: "Total Tutors",      value: stats.total_tutors,              icon: <Users size={18} />,      color: "text-blue-500",   bg: "bg-blue-50" },
    { label: "Ref Signups",       value: stats.total_signups_via_ref,     icon: <TrendingUp size={18} />, color: "text-green-500",  bg: "bg-green-50" },
    { label: "Pending Payout",    value: `$${stats.total_pending_payout}`, icon: <DollarSign size={18} />, color: "text-amber-500",  bg: "bg-amber-50" },
    { label: "Total Paid Out",    value: `$${stats.total_paid_out}`,      icon: <DollarSign size={18} />, color: "text-purple-500", bg: "bg-purple-50" },
  ] : [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-black text-purple-600">
            🎙️ Pronounce <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full ml-1">Admin</span>
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="card flex items-center gap-3 p-4">
              <div className={`w-9 h-9 ${k.bg} ${k.color} rounded-2xl flex items-center justify-center shrink-0`}>{k.icon}</div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide leading-tight">{k.label}</p>
                <p className="text-xl font-black text-gray-800">{k.value as string}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {(["overview", "commissions", "add"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${tab === t ? "bg-purple-500 text-white" : "bg-white border border-purple-200 text-purple-600 hover:bg-purple-50"}`}>
              {t === "overview" ? "Tutors" : t === "commissions" ? "Commissions" : "+ Add Tutor"}
            </button>
          ))}
        </div>
        {tab === "overview" && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Ref Code</th>
                <th className="pb-3 pr-4">Signups</th><th className="pb-3 pr-4">Subscribed</th>
                <th className="pb-3 pr-4">Conv%</th><th className="pb-3 pr-4">Pending $</th>
                <th className="pb-3 pr-4">Comm%</th><th className="pb-3">Status</th>
              </tr></thead>
              <tbody>
                {tutors.map((t, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4"><p className="font-bold text-gray-800">{t.name as string}</p><p className="text-xs text-gray-400">{t.email as string}</p></td>
                    <td className="py-3 pr-4"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{t.ref_code as string}</span></td>
                    <td className="py-3 pr-4 font-semibold">{t.total_signups as number}</td>
                    <td className="py-3 pr-4 font-bold text-green-600">{t.subscribed as number}</td>
                    <td className="py-3 pr-4 text-gray-600">{t.conversion_rate as number}%</td>
                    <td className="py-3 pr-4 font-bold text-amber-600">${t.pending_payout as number}</td>
                    <td className="py-3 pr-4 text-gray-600">{t.commission_pct as number}%</td>
                    <td className="py-3">
                      <button onClick={() => toggleStatus(t.id as string, t.status as string)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${t.status === "active" ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {t.status as string}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tutors.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No tutors yet. Click "+ Add Tutor" to get started.</p>}
          </div>
        )}
        {tab === "commissions" && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3 pr-4">Tutor</th><th className="pb-3 pr-4">Month</th>
                <th className="pb-3 pr-4">Plan</th><th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Commission</th><th className="pb-3">Action</th>
              </tr></thead>
              <tbody>
                {commissions.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 font-semibold">{((c.tutors as Record<string,unknown>)?.name as string) ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">{c.month as string}</td>
                    <td className="py-3 pr-4 text-gray-500 capitalize">{(c.plan_type as string) ?? "—"}</td>
                    <td className="py-3 pr-4 font-semibold">${c.amount_usd as number}</td>
                    <td className="py-3 pr-4 font-bold text-green-600">${c.commission_usd as number}</td>
                    <td className="py-3">
                      {c.status === "pending"
                        ? <button onClick={() => markPaid(c.id as string)} className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600"><Check size={11} /> Mark Paid</button>
                        : <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Check size={11} /> Paid</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {commissions.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No commissions yet.</p>}
          </div>
        )}
        {tab === "add" && (
          <div className="card max-w-lg">
            <h2 className="text-base font-black text-gray-800 mb-5">Add New Tutor</h2>
            <div className="space-y-4">
              {[
                { label: "Full Name", key: "name", placeholder: "Sarah Khan" },
                { label: "Email", key: "email", placeholder: "sarah@preply.com" },
                { label: "Ref Code (blank = auto-generate)", key: "ref_code", placeholder: "sarah-k" },
                { label: "Commission %", key: "commission_pct", placeholder: "20" },
                { label: "Notes (private)", key: "notes", placeholder: "Preply tutor, 200 students" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">{f.label}</label>
                  <input value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border-2 border-purple-200 focus:border-purple-400 focus:outline-none rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors" />
                </div>
              ))}
              <button onClick={addTutor} disabled={!form.name || !form.email || saving}
                className="btn-primary w-full disabled:opacity-50">
                {saving ? "Saving..." : saved ? "✓ Added!" : <><Plus size={16} /> Add Tutor</>}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
