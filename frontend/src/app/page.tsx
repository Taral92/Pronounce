import Link from "next/link";
import { Mic, BarChart3, Volume2, Users, Star } from "lucide-react";

const features = [
  { icon: <Mic size={22}/>, title: "Record & Analyse", desc: "Say any phrase and get an instant AI pronunciation score out of 100." },
  { icon: <BarChart3 size={22}/>, title: "Word-by-Word Feedback", desc: "Every word rated good, unclear, or incorrect with IPA phonetics and tips." },
  { icon: <Volume2 size={22}/>, title: "Hear the Difference", desc: "Listen to a native speaker say the same phrase — then replay yours side by side." },
  { icon: <Users size={22}/>, title: "3 Languages", desc: "Practise English (US/UK/AU), German, and Spanish (Latin/Castilian) accents." },
];

const testimonials = [
  { name: "Priya S.", role: "IELTS Student", text: "My speaking band went from 6.0 to 7.5 in 6 weeks using Pronounce every day.", stars: 5 },
  { name: "Carlos M.", role: "Job Interview Prep", text: "The word-by-word breakdown is incredible. I finally understand where I go wrong.", stars: 5 },
  { name: "Yuki T.", role: "Preply Learner", text: "I use this before every tutoring session. It's like a warm-up coach.", stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-black text-purple-600">🎙️ Pronounce</span>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors">Pricing</Link>
            <Link href="/login" className="btn-secondary py-2 px-4 text-sm">Sign In</Link>
            <Link href="/signup" className="btn-primary py-2 px-4 text-sm">Try Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
          ✨ AI Pronunciation Coach
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-5">
          Sound like a <span className="text-purple-500">native speaker</span>.<br/>Practice makes perfect.
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Record yourself, get a score out of 100, and hear exactly how natives say it. Works for English, German & Spanish.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">Start Free — 10 analyses/month</Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3">Sign In</Link>
        </div>
        <p className="text-xs text-gray-400 mt-3">No credit card required • Free forever tier</p>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div key={i} className="card flex gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-500 shrink-0">{f.icon}</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-black text-center text-gray-800 mb-8">Loved by language learners</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="card">
              <div className="flex gap-0.5 mb-3">
                {Array.from({length: t.stars}).map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400"/>)}
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-bold text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-purple-500 py-16 text-center text-white">
        <h2 className="text-3xl font-black mb-3">Ready to improve your pronunciation?</h2>
        <p className="text-purple-200 mb-6">Join thousands of learners improving every day.</p>
        <Link href="/signup" className="bg-white text-purple-600 font-bold px-8 py-3 rounded-2xl hover:bg-purple-50 transition-all shadow-lg inline-block">
          Get Started Free →
        </Link>
      </section>

      <footer className="text-center py-8 text-xs text-gray-400">
        © 2026 Pronounce. Built with ❤️ for language learners.
      </footer>
    </div>
  );
}
