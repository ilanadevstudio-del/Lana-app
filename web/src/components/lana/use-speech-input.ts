"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Minimal typing for the Web Speech API, which isn't in TypeScript's DOM lib. */
interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognitionCtor = new () => Recognition;

const noopSubscribe = () => () => {};

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text. Real, not simulated: uses the browser's recognition service where available
 * (Chrome, Edge, Safari). `onFinal` receives each finished phrase; `interim` is the phrase in progress.
 */
export function useSpeechInput(onFinal: (text: string) => void) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const rec = useRef<Recognition | null>(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onFinalRef.current(res[0].transcript.trim());
        else pending += res[0].transcript;
      }
      setInterim(pending.trim());
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    r.onerror = () => {
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    r.start();
    setListening(true);
  }, []);

  useEffect(() => () => rec.current?.stop(), []);

  return { supported, listening, interim, start, stop };
}
