"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { base64ToObjectUrl } from "@/lib/api";

interface Props { base64: string; label?: string; small?: boolean; }

export default function AudioPlayer({ base64, label = "Play", small = false }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const urlRef = useRef<string>("");

  useEffect(() => {
    urlRef.current = base64ToObjectUrl(base64);
    const audio = new Audio(urlRef.current);
    audio.onended = () => setPlaying(false);
    audioRef.current = audio;
    return () => { URL.revokeObjectURL(urlRef.current); };
  }, [base64]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  if (small) {
    return (
      <button onClick={toggle} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold transition-all active:scale-95">
        {playing ? <Pause size={12} /> : <Volume2 size={12} />}
        {label}
      </button>
    );
  }

  return (
    <button onClick={toggle} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all shadow-md hover:shadow-lg active:scale-95">
      {playing ? <Pause size={16} /> : <Play size={16} />}
      {playing ? "Pause" : label}
    </button>
  );
}
