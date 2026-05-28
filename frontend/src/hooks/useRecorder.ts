"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface Options { maxSeconds: number; onStop: (blob: Blob) => void; }

export function useRecorder({ maxSeconds, onStop }: Options) {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);
  const [audioLevel, setAudioLevel] = useState(0);
  const mrRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  const stopRecording = useCallback(() => {
    mrRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    setIsRecording(false);
    setSecondsLeft(maxSeconds);
    setAudioLevel(0);
  }, [maxSeconds]);

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;

    const tick = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      setAudioLevel(Math.min(100, (data.reduce((a, b) => a + b, 0) / data.length) * 2.5));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    const chunks: Blob[] = [];
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mrRef.current = mr;
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      ctx.close();
      onStop(new Blob(chunks, { type: "audio/webm" }));
    };
    mr.start();
    setIsRecording(true);
    setSecondsLeft(maxSeconds);

    let left = maxSeconds;
    timerRef.current = setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (left <= 0) stopRecording();
    }, 1000);
  }, [maxSeconds, onStop, stopRecording]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return { isRecording, secondsLeft, audioLevel, startRecording, stopRecording };
}
