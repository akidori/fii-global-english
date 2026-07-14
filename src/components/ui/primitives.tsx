"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// ---- Button ----------------------------------------------

type Variant = "primary" | "ghost" | "outline" | "danger";
export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      "bg-cyan-core/90 text-navy-900 font-semibold hover:bg-cyan-bright shadow-glow hover:shadow-glow-strong",
    ghost: "text-cyan-soft hover:bg-cyan-core/10",
    outline:
      "border border-cyan-core/40 text-cyan-soft hover:border-cyan-core hover:bg-cyan-core/10",
    danger: "border border-rose-400/40 text-rose-200 hover:bg-rose-500/10",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---- Card / Panel ----------------------------------------

export function Panel({
  className,
  children,
  hover,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div className={cn("panel rounded-2xl", hover && "panel-hover transition-all", className)}>
      {children}
    </div>
  );
}

// ---- Chip ------------------------------------------------

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-all",
        active
          ? "border-cyan-core bg-cyan-core/15 text-cyan-soft shadow-glow"
          : "border-white/10 text-muted hover:border-cyan-core/40 hover:text-cyan-soft",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ---- SectionTitle ----------------------------------------

export function SectionTitle({
  label,
  sub,
  icon,
}: {
  label: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon && <span className="text-cyan-core">{icon}</span>}
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-ink">{label}</h2>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}

// ---- ProgressRing (SVG) ----------------------------------

export function ProgressRing({
  ratio,
  size = 120,
  stroke = 9,
  children,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(120,220,255,0.14)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#45cdff"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 0.6s ease", filter: "drop-shadow(0 0 6px rgba(69,205,255,0.7))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// ---- XP Bar ----------------------------------------------

export function XPBar({ ratio, className }: { ratio: number; className?: string }) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-cyan-core/10", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-core to-violet-core transition-all duration-700"
        style={{ width: `${Math.max(2, Math.min(100, ratio * 100))}%`, boxShadow: "0 0 10px rgba(69,205,255,0.7)" }}
      />
    </div>
  );
}

// ---- Stat tile -------------------------------------------

export function Stat({
  value,
  label,
  icon,
  accent = "cyan",
}: {
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  accent?: "cyan" | "violet" | "amber";
}) {
  const color =
    accent === "violet" ? "text-violet-soft" : accent === "amber" ? "text-amber-300" : "text-cyan-soft";
  return (
    <Panel className="flex items-center gap-3 px-4 py-3">
      {icon && <span className={cn("shrink-0", color)}>{icon}</span>}
      <div>
        <div className={cn("text-xl font-bold leading-none glow-text", color)}>{value}</div>
        <div className="mt-1 text-[11px] text-muted">{label}</div>
      </div>
    </Panel>
  );
}
