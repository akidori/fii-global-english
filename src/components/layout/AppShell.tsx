"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SideNav, BottomNav } from "@/components/layout/Nav";
import { useLearningStore } from "@/store/use-learning-store";
import { levelProgress } from "@/lib/gamification";
import { XPBar } from "@/components/ui/primitives";
import { IconFlame, IconBolt, IconStar } from "@/components/ui/icons";
import { todayISO, diffDays } from "@/lib/date";

/**
 * ログイン後の共通シェル。上部に Duolingo 風のストリーク/XP/レベル。
 * プロフィール未設定なら初回オンボーディングへ誘導する。
 */
export function AppShell({
  children,
  requireProfile = true,
}: {
  children: React.ReactNode;
  requireProfile?: boolean;
}) {
  const router = useRouter();
  const profile = useLearningStore((s) => s.profile);
  const g = useLearningStore((s) => s.gamification);

  useEffect(() => {
    if (requireProfile && !profile) router.replace("/onboarding");
  }, [requireProfile, profile, router]);

  const lp = levelProgress(g.xp);
  // ストリークが途切れているか（今日/昨日以外の最終学習）
  const streakAlive =
    g.lastStudyDate === "" ||
    diffDays(todayISO(), g.lastStudyDate) <= 1;
  const streak = streakAlive ? g.streakDays : 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-x sticky top-0 z-10 flex items-center gap-3 border-b border-cyan-core/10 bg-navy-900/70 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-1.5 text-amber-300" title="連続学習日数">
            <IconFlame width={18} height={18} />
            <span className="text-sm font-bold">{streak}</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-soft" title="累計XP">
            <IconBolt width={18} height={18} />
            <span className="text-sm font-bold">{g.xp}</span>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-violet-soft" title="レベル">
              <IconStar width={14} height={14} />Lv.{lp.level}
            </span>
            <div className="min-w-0 flex-1">
              <XPBar ratio={lp.ratio} />
            </div>
          </div>
          <div className="hidden text-[11px] text-muted sm:block" title="今日の学習">
            今日 {g.todayMinutes}/{g.dailyGoalMinutes}分
          </div>
        </header>

        <main className="safe-x flex-1 px-4 pb-28 pt-4 lg:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
