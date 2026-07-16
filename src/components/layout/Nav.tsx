"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  IconHome,
  IconMap,
  IconGauge,
  IconTarget,
  IconChat,
  IconCards,
  IconRefresh,
  IconChart,
  IconFolder,
  IconGear,
  IconMenu,
  IconClose,
} from "@/components/ui/icons";
import { useState } from "react";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: <IconHome /> },
  { href: "/mission", label: "今日のミッション", icon: <IconTarget /> },
  { href: "/roleplay", label: "ロールプレイ", icon: <IconChat /> },
  { href: "/phrases", label: "仕事フレーズ", icon: <IconCards /> },
  { href: "/review", label: "復習", icon: <IconRefresh /> },
  { href: "/plan", label: "学習プラン", icon: <IconMap /> },
  { href: "/progress", label: "成長記録", icon: <IconChart /> },
  { href: "/assessment", label: "英語力診断", icon: <IconGauge /> },
  { href: "/projects", label: "実案件", icon: <IconFolder /> },
  { href: "/settings", label: "設定", icon: <IconGear /> },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="hidden shrink-0 flex-col gap-1 p-3 lg:flex lg:w-60">
      <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-core/15 text-cyan-core">
          <span className="font-mono text-sm font-bold glow-text">Fii</span>
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">Global English</div>
          <div className="text-[10px] tracking-widest text-cyan-soft/60">WORK-READY</div>
        </div>
      </Link>
      {NAV_ITEMS.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
              active
                ? "bg-cyan-core/15 text-cyan-soft shadow-glow"
                : "text-muted hover:bg-white/5 hover:text-ink",
            )}
          >
            <span className={active ? "text-cyan-core" : ""}>{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

// スマホ下部: 主要4タブ + メニュー。残りはメニューシートに格納する。
const PRIMARY_HREFS = ["/dashboard", "/mission", "/roleplay", "/review"];

export function BottomNav() {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const primary = NAV_ITEMS.filter((it) => PRIMARY_HREFS.includes(it.href));
  const rest = NAV_ITEMS.filter((it) => !PRIMARY_HREFS.includes(it.href));
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  const restActive = rest.some((it) => isActive(it.href));

  return (
    <>
      {/* メニューシート */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-cyan-core/25 bg-navy-800/95 p-4 pb-6 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">メニュー</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:text-cyan-soft"
                aria-label="閉じる"
              >
                <IconClose width={18} height={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {rest.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[11px] transition-all",
                      active
                        ? "border-cyan-core bg-cyan-core/15 text-cyan-soft"
                        : "border-white/8 bg-navy-700/50 text-muted",
                    )}
                  >
                    <span className={active ? "text-cyan-core" : "text-cyan-soft/70"}>{it.icon}</span>
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="safe-b safe-x fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-cyan-core/15 bg-navy-800/95 px-1 py-1.5 backdrop-blur lg:hidden">
        {primary.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] transition-all",
                active ? "text-cyan-core" : "text-muted",
              )}
            >
              {it.icon}
              <span className="whitespace-nowrap">{shortLabel(it.href, it.label)}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] transition-all",
            restActive || menuOpen ? "text-cyan-core" : "text-muted",
          )}
        >
          <IconMenu width={20} height={20} />
          <span>メニュー</span>
        </button>
      </nav>
    </>
  );
}

// 下部タブは幅が狭いので短縮ラベルにする。
function shortLabel(href: string, label: string): string {
  const map: Record<string, string> = {
    "/dashboard": "ホーム",
    "/mission": "ミッション",
    "/roleplay": "会話",
    "/review": "復習",
  };
  return map[href] ?? label;
}
