"use client";

// ============================================================
// 音声: Web Speech API（STT/TTS）ラッパー。
// 非対応ブラウザでも壊れないよう、必ず対応可否を返す。
// ============================================================

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface SttHandle {
  stop: () => void;
}

/** 音声認識を開始。onFinal に確定テキストを渡す。 */
export function startStt(opts: {
  lang?: string;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: unknown) => void;
  onEnd?: () => void;
}): SttHandle | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = opts.lang ?? "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = 0; i < e.results.length; i++) {
      const alt = e.results[i]?.[0];
      const t = alt?.transcript ?? "";
      // interimResults=true の場合、確定分も results に含まれる
      interim += t;
    }
    finalText = interim;
    opts.onInterim?.(interim);
  };
  rec.onerror = (err) => opts.onError?.(err);
  rec.onend = () => {
    if (finalText.trim()) opts.onFinal(finalText.trim());
    opts.onEnd?.();
  };
  try {
    rec.start();
  } catch (err) {
    opts.onError?.(err);
    return null;
  }
  return { stop: () => rec.stop() };
}

let voicesCache: SpeechSynthesisVoice[] = [];
function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  if (!ttsSupported()) return undefined;
  if (!voicesCache.length) voicesCache = window.speechSynthesis.getVoices();
  return (
    voicesCache.find((v) => /en[-_]US/i.test(v.lang) && /female|Samantha|Google US/i.test(v.name)) ??
    voicesCache.find((v) => /en[-_]US/i.test(v.lang)) ??
    voicesCache.find((v) => /^en/i.test(v.lang))
  );
}

/** 英文を読み上げる。非対応なら false を返す。onEnd は読み上げ完了時に呼ぶ。 */
export function speak(
  text: string,
  opts?: { rate?: number; onEnd?: () => void },
): boolean {
  if (!ttsSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = opts?.rate ?? 0.95;
    const v = pickEnglishVoice();
    if (v) u.voice = v;
    if (opts?.onEnd) {
      u.onend = () => opts.onEnd!();
      u.onerror = () => opts.onEnd!();
    }
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
