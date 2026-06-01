"use client";

import { useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { base64ToObjectUrl } from "@/lib/api";

interface Props {
  base64: string;
  label?: string;
  small?: boolean;
}

export function ComparePlayer({
  nativeBase64,
  userBase64,
}: {
  nativeBase64?: string;
  userBase64: string;
}) {
  const nativeUrl = useMemo(() => (nativeBase64 ? base64ToObjectUrl(nativeBase64) : ""), [nativeBase64]);
  const userUrl = useMemo(() => base64ToObjectUrl(userBase64), [userBase64]);

  const nativeRef = useRef<HTMLAudioElement | null>(null);
  const userRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<"native" | "user" | null>(null);

  const play = (kind: "native" | "user") => {
    const active = kind === "native" ? nativeRef : userRef;
    const other = kind === "native" ? userRef : nativeRef;

    other.current?.pause();

    if (!active.current) {
      active.current = new Audio(kind === "native" ? nativeUrl : userUrl);
    }

    active.current.onended = () => setPlaying(null);
    active.current.currentTime = 0;
    active.current.play();
    setPlaying(kind);
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Compare pronunciation</h3>
        <p className="mt-1 text-xs text-gray-500">Switch between the native model and your own recording to hear the gap clearly.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => nativeBase64 && play("native")}
          disabled={!nativeBase64}
          className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {playing === "native" ? <Pause size={16} /> : <Play size={16} />}
          Native
        </button>

        <button
          onClick={() => play("user")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800"
        >
          {playing === "user" ? <Pause size={16} /> : <Volume2 size={16} />}
          You
        </button>
      </div>
    </div>
  );
}

export default function AudioPlayer({ base64, label = "Play", small = false }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const url = useMemo(() => base64ToObjectUrl(base64), [base64]);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  if (small) {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 transition active:scale-95 hover:bg-purple-200"
      >
        {playing ? <Pause size={12} /> : <Volume2 size={12} />}
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-2xl bg-purple-500 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-purple-600 hover:shadow-lg active:scale-95"
    >
      {playing ? <Pause size={16} /> : <Play size={16} />}
      {playing ? "Pause" : label}
    </button>
  );
}