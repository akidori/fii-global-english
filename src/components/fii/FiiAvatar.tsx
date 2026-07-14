"use client";

import { cn } from "@/lib/cn";
import { FII_SPRITE, type FiiState } from "@/data/fii-lines";

/**
 * Fii のスプライト表示。状態で表情が変わる。
 * 画像は public/fii/*.png（fii-desktop の 2D アセット由来）。
 */
export function FiiAvatar({
  state = "idle",
  size = 128,
  float = true,
  className,
}: {
  state?: FiiState;
  size?: number;
  float?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("relative select-none", float && "animate-fii-float", className)}
      style={{ width: size, height: size }}
    >
      {/* 発光する足元シャドウ */}
      <div
        aria-hidden
        className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-[50%] animate-fii-glow"
        style={{
          width: size * 0.6,
          height: size * 0.12,
          background:
            "radial-gradient(ellipse at center, rgba(57,197,255,0.5), rgba(57,197,255,0) 70%)",
          filter: "blur(2px)",
        }}
      />
      <img
        src={FII_SPRITE[state]}
        alt={`Fii (${state})`}
        width={size}
        height={size}
        className="relative h-full w-full object-contain"
        style={{ filter: "drop-shadow(0 0 12px rgba(69,205,255,0.35))" }}
      />
    </div>
  );
}
