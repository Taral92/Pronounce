import type { AnalyzeResponse, UserLimits, LanguageConfig, AnalyzeMode, AudioResponse } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e: Record<string, unknown> = new Error((err as { detail?: string })?.detail ?? "Request failed") as unknown as Record<string, unknown>;
    e.status = res.status;
    e.detail = (err as { detail?: string })?.detail;
    throw e;
  }

  return res.json();
}

export async function analyzePronunciation(
  token: string,
  params: {
    mode: AnalyzeMode;
    phrase?: string;
    audio: Blob;
    language: string;
    accent: string;
  }
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("audio", params.audio, "recording.webm");
  form.append("mode", params.mode);
  form.append("language", params.language);
  form.append("accent", params.accent);

  if (params.mode === "guided" && params.phrase?.trim()) {
    form.append("phrase", params.phrase.trim());
  }

  return req<AnalyzeResponse>(token, "/analyze", { method: "POST", body: form });
}

export async function getWordTTS(token: string, word: string, language: string): Promise<string> {
  const data = await req<AudioResponse>(
    token,
    `/tts/word?w=${encodeURIComponent(word)}&language=${language}`
  );
  return data.audio_base64;
}

export async function getFeedbackTTS(token: string, text: string, language: string, accent: string): Promise<string> {
  const data = await req<AudioResponse>(
    token,
    `/tts/feedback?text=${encodeURIComponent(text)}&language=${language}&accent=${accent}`
  );
  return data.audio_base64;
}

export async function getUserLimits(token: string): Promise<UserLimits> {
  return req<UserLimits>(token, "/me/limits");
}

export async function getLanguages(token: string): Promise<LanguageConfig[]> {
  return req<LanguageConfig[]>(token, "/me/languages");
}

export function base64ToObjectUrl(b64: string): string {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: "audio/mpeg" }));
}