"use client";
import { useRecorder } from "@/hooks/useRecorder";
import { Mic, Square, Loader2 } from "lucide-react";

interface Props {
  maxSeconds: number;
  onAudioReady: (blob: Blob) => void;
  disabled?: boolean;
  analyzing?: boolean;
}

export default function AudioRecorder({ maxSeconds, onAudioReady, disabled, analyzing }: Props) {
  const { isRecording, secondsLeft, audioLevel, startRecording, stopRecording } =
    useRecorder({ maxSeconds, onStop: onAudioReady });

  const pct = ((maxSeconds - secondsLeft) / maxSeconds) * 100;

  if (analyzing) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
          <Loader2 size={28} className="text-purple-500 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-purple-500 animate-pulse">Analysing your pronunciation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {isRecording && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
            <span className="text-red-500 animate-pulse">● Recording</span>
            <span>{secondsLeft}s left</span>
          </div>
          <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full bg-red-400 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-purple-400 transition-all duration-75"
                style={{ height: `${8 + (audioLevel / 100) * 24 * Math.random()}px` }}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40
          ${isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-purple-500 hover:bg-purple-600"
          }`}
      >
        {isRecording
          ? <Square size={28} className="text-white" fill="white" />
          : <Mic size={28} className="text-white" />
        }
      </button>
      <p className="text-xs font-semibold text-gray-400">
        {isRecording ? "Tap to stop" : "Tap to record"}
      </p>
    </div>
  );
}
