"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/primitives";
import { IconMic, IconArrowRight } from "@/components/ui/icons";
import { startStt, sttSupported, type SttHandle } from "@/lib/speech";

/**
 * 英語回答の入力欄。テキスト + 音声（Web Speech API）。
 * 音声非対応ブラウザではマイクを隠しテキストのみにフォールバック。
 * onSubmit には確定テキストと、入力開始からの経過ms を渡す。
 */
export function AnswerInput({
  onSubmit,
  placeholder = "英語で入力（または音声）…",
  submitLabel = "送信",
  autoFocusKey,
}: {
  onSubmit: (text: string, ms: number) => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocusKey?: string | number;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const startRef = useRef<number>(Date.now());
  const sttRef = useRef<SttHandle | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // 新しい問い/ターンごとにタイマーをリセット
    startRef.current = Date.now();
    setText("");
    taRef.current?.focus();
    return () => sttRef.current?.stop();
  }, [autoFocusKey]);

  function toggleMic() {
    if (listening) {
      sttRef.current?.stop();
      return;
    }
    const handle = startStt({
      onInterim: (t) => setText(t),
      onFinal: (t) => setText(t),
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (handle) {
      sttRef.current = handle;
      setListening(true);
    }
  }

  function submit() {
    const t = text.trim();
    if (!t) return;
    onSubmit(t, Date.now() - startRef.current);
    setText("");
    startRef.current = Date.now();
  }

  return (
    <div className="panel rounded-2xl p-3">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        {sttSupported() ? (
          <button
            type="button"
            onClick={toggleMic}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all",
              listening
                ? "bg-rose-500/20 text-rose-200 animate-pulse"
                : "text-cyan-soft hover:bg-cyan-core/10",
            )}
          >
            <IconMic width={16} height={16} />
            {listening ? "録音中… 話して" : "音声で答える"}
          </button>
        ) : (
          <span className="text-[10px] text-muted/60">
            このブラウザは音声入力に非対応（テキストで回答）
          </span>
        )}
        <Button onClick={submit} disabled={!text.trim()} className="px-4 py-2 text-xs">
          {submitLabel} <IconArrowRight width={15} height={15} />
        </Button>
      </div>
    </div>
  );
}
