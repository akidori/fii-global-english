"use client";

import { cn } from "@/lib/cn";
import { IconSpeaker } from "@/components/ui/icons";
import { speak, ttsSupported } from "@/lib/speech";
import type { ReactNode } from "react";

/** Fii の吹き出し。英文なら読み上げボタンを出す。 */
export function FiiCoachBubble({
  children,
  english,
  className,
  tone = "cyan",
}: {
  children: ReactNode;
  english?: string;
  className?: string;
  tone?: "cyan" | "violet";
}) {
  const border = tone === "violet" ? "border-violet-core/40" : "border-cyan-core/30";
  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-navy-700/70 px-4 py-3 text-sm text-ink shadow-glow backdrop-blur animate-pop-in",
        border,
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 whitespace-pre-wrap leading-relaxed">{children}</div>
        {english && ttsSupported() && (
          <button
            type="button"
            onClick={() => speak(english)}
            aria-label="読み上げる"
            className="mt-0.5 shrink-0 rounded-lg p-1.5 text-cyan-soft transition hover:bg-cyan-core/15"
          >
            <IconSpeaker width={18} height={18} />
          </button>
        )}
      </div>
    </div>
  );
}
