"use client";

import { useState, useCallback } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { analyzePronunciation } from "@/lib/api";
import { useLimits } from "@/hooks/useLimits";
import ScoreCircle from "@/components/ui/ScoreCircle";
import { ComparePlayer } from "@/components/ui/AudioPlayer";
import UsageBadge from "@/components/ui/UsageBadge";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import LanguageTabs from "@/components/pronunciation/LanguageTabs";
import AccentSelector from "@/components/pronunciation/AccentSelector";
import PhraseInput from "@/components/pronunciation/PhraseInput";
import AudioRecorder from "@/components/pronunciation/AudioRecorder";
import DimensionScores from "@/components/pronunciation/DimensionScores";
import WordCards from "@/components/pronunciation/WordCards";
import FeedbackPanel from "@/components/pronunciation/FeedbackPanel";
import type { AnalyzeResponse, LanguageConfig, AppState, AnalyzeMode } from "@/types";
import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


const DEFAULT_LANGUAGES: LanguageConfig[] = [
  {
    key: "english",
    label: "English",
    flag: "🇬🇧",
    default_accent: "american",
    accents: {
      american: { voice_id: "", label: "🇺🇸 American" },
      british: { voice_id: "", label: "🇬🇧 British" },
      australian: { voice_id: "", label: "🇦🇺 Australian" },
    },
  },
  {
    key: "german",
    label: "German",
    flag: "🇩🇪",
    default_accent: "standard",
    accents: {
      standard: { voice_id: "", label: "🇩🇪 Standard" },
    },
  },
  {
    key: "spanish",
    label: "Spanish",
    flag: "🇪🇸",
    default_accent: "latin_american",
    accents: {
      latin_american: { voice_id: "", label: "🇲🇽 Latin American" },
      castilian: { voice_id: "", label: "🇪🇸 Castilian" },
    },
  },
];

function summaryLabel(score: number) {
  if (score >= 90) return "Very clear and natural overall";
  if (score >= 75) return "Clear overall with a few noticeable fixes";
  if (score >= 60) return "Understandable, with useful polish areas";
  if (score >= 40) return "Several issues are reducing clarity";
  return "Focus on clarity before accent polish";
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


  const { isSignedIn, isLoaded } = useAuth();

  const router = useRouter();

  useEffect(() => {

  if (!isLoaded) return;

  if (!isSignedIn) {

    router.replace("/");

  }

}, [isLoaded, isSignedIn, router]);

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

  const primaryFix = result?.practice_words?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/40">
      <header className="sticky top-0 z-40 border-b border-purple-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-purple-600">Pronounce</span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-500">Coach</span>
          </div>
          <div className="flex items-center gap-3">
            {!limitsLoading && limits && <UsageBadge limits={limits} />}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="card space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Sound clearer in real conversations</h1>
            <p className="text-sm text-gray-600">Record once, get practical pronunciation coaching, then retry only the words that matter most.</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Language</p>
            <LanguageTabs languages={DEFAULT_LANGUAGES} selected={language} onChange={handleLanguageChange} />
          </div>

          {limits?.accent_selector_enabled && (
            <AccentSelector language={currentLang} selected={accent} onChange={setAccent} />
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Practice mode</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("guided")}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  mode === "guided" ? "border-purple-500 bg-purple-500 text-white" : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                Read and practice
              </button>
              <button
                onClick={() => setMode("free")}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  mode === "free" ? "border-purple-500 bg-purple-500 text-white" : "border-gray-200 bg-white text-gray-700"
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
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Your target sentence</p>
                <PhraseInput
                  value={phrase}
                  onChange={setPhrase}
                  maxChars={maxChars}
                  language={language}
                  disabled={appState === "analyzing"}
                />
              </div>
            )}

            <div className={mode === "guided" ? "border-t border-purple-100 pt-5" : ""}>
              <p className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-gray-400">
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
              <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-500">
                {error}
              </p>
            )}
          </section>
        )}

        {appState === "results" && result && (
          <section className="space-y-5">
            <div className="card space-y-5">
              <div className="flex flex-col items-center gap-4 text-center">
                <ScoreCircle score={result.overall_score} secondaryScore={result.pronunciation_score} />
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">{summaryLabel(result.overall_score)}</p>
                  <p className="text-sm text-gray-500">Overall score prioritizes intelligibility first, then accent polish.</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-3xl bg-gray-50 p-4 text-sm text-gray-600 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">You said</p>
                  <p className="font-medium text-gray-800">“{result.transcribed || "—"}”</p>
                </div>

                {result.mode === "guided" && result.intended && (
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Target</p>
                    <p className="font-medium text-gray-800">“{result.intended}”</p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-purple-100 bg-purple-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-purple-700">
                  <Sparkles size={16} />
                  <p className="text-sm font-bold">Main takeaway</p>
                </div>
                <p className="text-sm leading-relaxed text-gray-700">
                  {primaryFix
                    ? `Start with “${primaryFix.word}”. ${primaryFix.what_to_fix} Next try: ${primaryFix.next_try_tip}`
                    : result.overall_feedback}
                </p>
              </div>

              <DimensionScores
                scores={{
                  pronunciation_score: result.pronunciation_score,
                  accuracy_score: result.accuracy_score,
                  fluency_score: result.fluency_score,
                  completeness_score: result.completeness_score,
                  prosody_score: result.prosody_score,
                }}
              />
            </div>

            <ComparePlayer
              nativeBase64={result.native_audio_base64}
              userBase64={result.full_user_audio_base64}
            />

            {result.practice_words.length > 0 ? (
              <div className="card">
                <WordCards
                  words={result.practice_words}
                  language={result.language}
                  accent={result.accent}
                  phoneticsEnabled={limits?.phonetics_enabled ?? true}
                  wordTtsEnabled={limits?.word_tts_enabled ?? true}
                />
              </div>
            ) : (
              <div className="card text-center">
                <p className="text-lg font-semibold text-green-700">Nice work — your pronunciation was clear and natural overall.</p>
                <p className="mt-2 text-sm text-gray-500">Try a harder sentence, a faster delivery, or a different accent to keep improving.</p>
              </div>
            )}

            <FeedbackPanel feedback={result.overall_feedback} />

            <button onClick={reset} className="btn-primary w-full">
              <RefreshCw size={16} /> Practice another phrase
            </button>

            {result.analyses_remaining !== null && (
              <p className="text-center text-xs font-semibold text-gray-400">
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