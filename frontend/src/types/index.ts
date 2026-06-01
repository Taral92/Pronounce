export type Tier = "blocked" | "free" | "trial" | "pro" | "admin";
export type AnalyzeMode = "guided" | "free";

export interface WordPartsFeedback {
  start?: string;
  middle?: string;
  end?: string;
}

export interface PracticeWord {
  word: string;
  spoken?: string;
  phonetic?: string;
  severity: "low" | "medium" | "high";
  what_was_good?: string;
  what_to_fix: string;
  next_try_tip: string;
  parts?: WordPartsFeedback;
  user_audio_base64?: string;
}

export interface PhonemeScore {
  phoneme: string;
  accuracy_score?: number;
  offset?: number;
  duration?: number;
}

export interface SyllableScore {
  syllable: string;
  grapheme?: string;
  accuracy_score?: number;
  offset?: number;
  duration?: number;
}

export interface AnalyzedWordScore {
  word: string;
  accuracy_score?: number;
  error_type?: string;
  offset?: number;
  duration?: number;
  syllables: SyllableScore[];
  phonemes: PhonemeScore[];
}

export interface AnalyzeResponse {
  mode: AnalyzeMode;
  overall_score: number;
  pronunciation_score?: number;
  accuracy_score?: number;
  fluency_score?: number;
  prosody_score?: number;
  completeness_score?: number;
  overall_feedback: string;
  transcribed: string;
  intended?: string | null;
  language: string;
  accent: string;
  native_audio_base64?: string;
  full_user_audio_base64: string;
  practice_words: PracticeWord[];
  sound_map: AnalyzedWordScore[];
  analyses_remaining: number | null;
}

export interface AudioResponse {
  audio_base64: string;
}

export interface UserLimits {
  monthly_analyses: number | null;
  max_recording_secs: number;
  max_phrase_chars: number;
  analyses_used: number;
  analyses_remaining: number | null;
  welcome_bonus_remaining: number;
  tier: Tier;
  global_free_mode: boolean;
  languages_available: string[];
  word_tts_enabled: boolean;
  accent_selector_enabled: boolean;
  phonetics_enabled: boolean;
}

export interface AccentConfig {
  voice_id: string;
  label: string;
}

export interface LanguageConfig {
  key: string;
  label: string;
  flag: string;
  default_accent: string;
  accents: Record<string, AccentConfig>;
}

export type AppState = "idle" | "recording" | "analyzing" | "results" | "error";