"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<"native" | "user" | null>(null);
  const [loading, setLoading] = useState<"native" | "user" | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlaying(null);
    setLoading(null);
  };

  const play = async (kind: "native" | "user") => {
    try {
      stop();

      const base64 = kind === "native" ? nativeBase64 : userBase64;

      console.log("ComparePlayer click", {
        kind,
        hasBase64: !!base64,
        length: base64?.length ?? 0,
        nativeLength: nativeBase64?.length ?? 0,
        userLength: userBase64?.length ?? 0,
      });

      if (!base64) {
        console.warn(`${kind} audio missing`);
        return;
      }

      setLoading(kind);

      const src = `data:audio/mpeg;base64,${base64}`;
      const audio = new Audio();
      audioRef.current = audio;
      audio.preload = "auto";
      audio.src = src;

      audio.onended = () => {
        setPlaying(null);
        setLoading(null);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error(`${kind} audio failed`, e, {
          base64Length: base64.length,
          base64Start: base64.slice(0, 40),
        });
        setPlaying(null);
        setLoading(null);
        audioRef.current = null;
      };

      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error(`${kind} audio could not be loaded`));
        };

        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onCanPlay);
          audio.removeEventListener("error", onError);
        };

        audio.addEventListener("canplaythrough", onCanPlay, { once: true });
        audio.addEventListener("error", onError, { once: true });
        audio.load();
      });

      await audio.play();
      setPlaying(kind);
      setLoading(null);
    } catch (err) {
      console.error(`Failed to play ${kind} audio`, err);
      setPlaying(null);
      setLoading(null);
      audioRef.current = null;
    }
  };

  const nativeDisabled = !nativeBase64 || loading !== null;
  const userDisabled = loading !== null;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Compare pronunciation
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Switch between the native model and your own recording to hear the gap clearly.
        </p>

        <p className="mt-2 text-[11px] text-gray-400">
          Native audio: {nativeBase64 ? `yes (${nativeBase64.length} chars)` : "missing"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => (playing === "native" ? stop() : play("native"))}
          disabled={nativeDisabled}
          className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "native" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : playing === "native" ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
          {loading === "native" ? "Loading..." : "Native"}
        </button>

        <button
          type="button"
          onClick={() => (playing === "user" ? stop() : play("user"))}
          disabled={userDisabled}
          className="flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "user" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : playing === "user" ? (
            <Pause size={16} />
          ) : (
            <Volume2 size={16} />
          )}
          {loading === "user" ? "Loading..." : "You"}
        </button>
      </div>
    </div>
  );
}

export default function AudioPlayer({
  base64,
  label = "Play",
  small = false,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const url = useMemo(() => base64ToObjectUrl(base64), [base64]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  const toggle = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        console.error("Audio playback failed");
        setPlaying(false);
      };
    }

    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (playing) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch (error) {
      console.error("Audio playback failed", error);
      setPlaying(false);
    }
  };

  if (small) {
    return (
      <button
        type="button"
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
      type="button"
      onClick={toggle}
      className="flex items-center gap-2 rounded-2xl bg-purple-500 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-purple-600 hover:shadow-lg active:scale-95"
    >
      {playing ? <Pause size={16} /> : <Play size={16} />}
      {playing ? "Pause" : label}
    </button>
  );
}