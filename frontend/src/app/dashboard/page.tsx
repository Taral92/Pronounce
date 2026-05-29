"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { analyzePronunciation, base64ToObjectUrl } from "@/lib/api";
import { useLimits } from "@/hooks/useLimits";
import ScoreCircle from "@/components/ui/ScoreCircle";
import UsageBadge from "@/components/ui/UsageBadge";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import LanguageTabs from "@/components/pronunciation/LanguageTabs";
import AccentSelector from "@/components/pronunciation/AccentSelector";
import PhraseInput from "@/components/pronunciation/PhraseInput";
import AudioRecorder from "@/components/pronunciation/AudioRecorder";
import WordCards from "@/components/pronunciation/WordCards";
import type { AnalyzeResponse, LanguageConfig, AppState, AnalyzeMode } from "@/types";
import { RefreshCw, Volume2 } from "lucide-react";

const DEFAULT_LANGUAGES: LanguageConfig[] = [
  { key: "english", label: "English", flag: "🇬🇧", default_accent: "american",
    accents: { american: { voice_id: "", label: "🇺🇸 American" }, british: { voice_id: "", label: "🇬🇧 British" }, australian: { voice_id: "", label: "🇦🇺 Australian" } } },
  { key: "german",  label: "German",  flag: "🇩🇪", default_accent: "standard",
    accents: { standard: { voice_id: "", label: "🇩🇪 Standard" } } },
  { key: "spanish", label: "Spanish", flag: "🇪🇸", default_accent: "latin_american",
    accents: { latin_american: { voice_id: "", label: "🇲🇽 Latin American" }, castilian: { voice_id: "", label: "🇪🇸 Castilian" } } },
];

function playBase64(base64: string) {
  const url = base64ToObjectUrl(base64);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.play();
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Good base";
  if (score >= 40) return "Needs polish";
  return "Needs support";
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { limits, loading: limitsLoading, refresh: refreshLimits } = useLimits();

  const [mode, setMode] = useState<AnalyzeMode>("guided");
  const [phrase, setPhrase] = useState("");
  const [language, setLanguage] = useState("english");
  const [accent, setAccent] = useState("american");
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const currentLang = DEFAULT_LANGUAGES.find(l => l.key === language) ?? DEFAULT_LANGUAGES[0];
  const maxChars = limits?.max_phrase_chars ?? 200;
  const maxSecs = limits?.max_recording_secs ?? 30;

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const cfg = DEFAULT_LANGUAGES.find(l => l.key === lang);
    if (cfg) setAccent(cfg.default_accent);
  };

  const handleAudioReady = useCallback(async (blob: Blob) => {
    if (mode === "guided" && !phrase.trim()) {
      setError("Please type a phrase first.");
      return;
    }

    setAppState("analyzing");
    setError("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await analyzePronunciation(token, {
        mode,
        phrase: mode === "guided" ? phrase : undefined,
        audio: blob,
        language,
        accent,
      });

      setResult(res);
      setAppState("results");
      refreshLimits();
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      if (err?.status === 402 || err?.detail === "monthly_limit_reached" || err?.detail === "limit_reached") {
        setShowUpgrade(true);
        setAppState("idle");
      } else {
        setError(err?.detail ?? "Something went wrong. Please try again.");
        setAppState("error");
      }
    }
  }, [mode, phrase, language, accent, getToken, refreshLimits]);

  const reset = () => {
    setAppState("idle");
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/40">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-purple-600">Pronounce</span>
            <span className="text-xs bg-purple-100 text-purple-500 px-2 py-0.5 rounded-full font-bold">Coach</span>
          </div>
          <div className="flex items-center gap-3">
            {!limitsLoading && limits && <UsageBadge limits={limits} />}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <section className="card space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Sound clearer in real conversations</h1>
            <p className="text-sm text-gray-600">Record once, get realistic coaching, then retry only the words that matter most.</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Language</p>
            <LanguageTabs languages={DEFAULT_LANGUAGES} selected={language} onChange={handleLanguageChange} />
          </div>

          {limits?.accent_selector_enabled && (
            <AccentSelector language={currentLang} selected={accent} onChange={setAccent} />
          )}

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Practice mode</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("guided")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold border transition ${
                  mode === "guided" ? "bg-purple-500 text-white border-purple-500" : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                Read and practice
              </button>
              <button
                onClick={() => setMode("free")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold border transition ${
                  mode === "free" ? "bg-purple-500 text-white border-purple-500" : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                Speak naturally
              </button>
            </div>
          </div>
        </section>

        {appState !== "results" && (
          <section className="card space-y-5">
            {mode === "guided" && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Your target sentence</p>
                <PhraseInput
                  value={phrase}
                  onChange={setPhrase}
                  maxChars={maxChars}
                  language={language}
                  disabled={appState === "analyzing"}
                />
              </div>
            )}

            <div className={`${mode === "guided" ? "border-t border-purple-100 pt-5" : ""}`}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide text-center mb-4">
                {mode === "guided" ? "Now say it clearly and naturally" : "Say a short sentence or thought"}
              </p>
              <AudioRecorder
                maxSeconds={maxSecs}
                onAudioReady={handleAudioReady}
                disabled={appState === "analyzing"}
                analyzing={appState === "analyzing"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-semibold text-center bg-red-50 rounded-xl py-2 px-4">
                {error}
              </p>
            )}
          </section>
        )}

        {appState === "results" && result && (
          <section className="space-y-5">
            <div className="card flex flex-col items-center gap-5">
              <ScoreCircle score={result.overall_score} />
              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-gray-900">{scoreLabel(result.overall_score)}</p>
                <p className="text-sm text-gray-500">This score focuses on clarity first, then accent polish.</p>
              </div>

              <div className="text-center text-sm text-gray-500 space-y-1">
                <p><span className="font-semibold text-gray-700">You said:</span> “{result.transcribed}”</p>
                {result.mode === "guided" && result.intended && (
                  <p><span className="font-semibold text-gray-700">Target:</span> “{result.intended}”</p>
                )}
              </div>

              <div className="w-full flex justify-center">
                <button
                  onClick={() => playBase64(result.full_user_audio_base64)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold"
                >
                  <Volume2 size={16} /> Play your recording
                </button>
              </div>

              <div className="text-center max-w-xl">
                <p className="text-sm text-gray-700 font-medium">{result.overall_feedback}</p>
              </div>
            </div>

            {result.practice_words.length > 0 && (
              <div className="card">
                <WordCards
                  words={result.practice_words}
                  language={result.language}
                  accent={result.accent}
                  phoneticsEnabled={limits?.phonetics_enabled ?? true}
                  wordTtsEnabled={limits?.word_tts_enabled ?? true}
                />
              </div>
            )}

            {result.practice_words.length === 0 && (
              <div className="card text-center">
                <p className="text-lg font-semibold text-green-700">Nice work — your pronunciation was clear and natural overall.</p>
                <p className="text-sm text-gray-500 mt-2">Try a harder sentence, a faster delivery, or a different accent to keep improving.</p>
              </div>
            )}

            <button onClick={reset} className="btn-primary w-full">
              <RefreshCw size={16} /> Practice another phrase
            </button>

            {result.analyses_remaining !== null && (
              <p className="text-center text-xs text-gray-400 font-semibold">
                {result.analyses_remaining} analyses remaining this month
              </p>
            )}
          </section>
        )}
      </main>

      {showUpgrade && <UpgradePrompt onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}