"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { FiiCoachBubble } from "@/components/fii/FiiCoachBubble";
import { Panel, ProgressRing, Stat, SectionTitle, Button } from "@/components/ui/primitives";
import {
  IconTarget,
  IconFlame,
  IconStar,
  IconArrowRight,
  IconCards,
  IconChat,
  IconRefresh,
} from "@/components/ui/icons";
import { currentWeekTheme, SCENE_LABEL } from "@/lib/plan-generator";
import { DIMENSION_LABEL, WORK_LEVEL_LABEL } from "@/lib/labels";
import { FII_GREETINGS, pick } from "@/data/fii-lines";
import { duePhrases } from "@/lib/spaced-repetition";
import { diffDays, todayISO } from "@/lib/date";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardInner />
    </AppShell>
  );
}

function DashboardInner() {
  const profile = useLearningStore((s) => s.profile);
  const plan = useLearningStore((s) => s.plan);
  const planStart = useLearningStore((s) => s.planStartDate);
  const g = useLearningStore((s) => s.gamification);
  const phrases = useLearningStore((s) => s.phrases);

  const weekIndex = useMemo(
    () => (planStart ? Math.floor(diffDays(todayISO(), planStart) / 7) : 0),
    [planStart],
  );
  const greeting = useMemo(() => pick(FII_GREETINGS), []);

  if (!profile || !plan) return null;

  const theme = currentWeekTheme(plan, weekIndex);
  const dueCount = duePhrases(phrases).length;
  const goalRatio = Math.min(1, g.todayMinutes / g.dailyGoalMinutes);
  const goalDone = g.todayMinutes >= g.dailyGoalMinutes;
  const couldNotSay = phrases
    .filter((p) => p.source === "could_not_say" || p.source === "slow")
    .slice(0, 3);
  const focusSkill = plan.focusSkills[0];

  return (
    <div className="space-y-5">
      {/* Fii ヘッダー */}
      <div className="flex items-center gap-4">
        <FiiAvatar state={goalDone ? "happy" : "idle"} size={92} />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-ink">
            おかえり、{profile.name.replace(/さん$/, "")}。
          </h1>
          <FiiCoachBubble className="mt-1.5" tone="cyan">
            {goalDone ? "今日のノルマは達成済み。上出来。" : greeting}
          </FiiCoachBubble>
        </div>
      </div>

      {/* 今日のミッション */}
      <Panel hover className="overflow-hidden">
        <div className="flex items-center gap-4 p-5">
          <ProgressRing ratio={goalRatio} size={96}>
            <div className="text-lg font-bold text-cyan-soft">{g.todayMinutes}</div>
            <div className="text-[9px] text-muted">/{g.dailyGoalMinutes}分</div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-cyan-soft/70">
              <IconTarget width={14} height={14} /> 今日のミッション
            </div>
            <div className="text-sm font-semibold text-ink">今週のテーマ「{theme.title}」を進める</div>
            <div className="mt-0.5 text-xs text-muted">
              今日鍛える力: {focusSkill ? DIMENSION_LABEL[focusSkill] : "会話継続"}
            </div>
            <Link href="/mission">
              <Button className="mt-3 w-full sm:w-auto">
                ミッション開始 <IconArrowRight width={16} height={16} />
              </Button>
            </Link>
          </div>
        </div>
      </Panel>

      {/* ステータス */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<IconFlame width={20} height={20} />} value={g.streakDays} label="連続日数" accent="amber" />
        <Stat icon={<IconStar width={20} height={20} />} value={`Lv.${g.level}`} label="アプリレベル" accent="violet" />
        <Stat icon={<IconCards width={20} height={20} />} value={g.masteredPhrases} label="習得フレーズ" />
        <Stat icon={<IconRefresh width={20} height={20} />} value={dueCount} label="復習待ち" />
      </div>

      {/* レベル目標 */}
      <Panel className="p-4">
        <SectionTitle label="ゴールまでの距離" sub={SCENE_LABEL[plan.focusScene]} />
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="text-center">
            <div className="text-xs text-muted">現在</div>
            <div className="font-bold text-cyan-soft">
              {plan.currentLevel} / Lv.{plan.currentWorkLevel}
            </div>
            <div className="text-[10px] text-muted">{WORK_LEVEL_LABEL[plan.currentWorkLevel]}</div>
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-cyan-core/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-core to-violet-core"
              style={{ width: `${levelDistance(plan.currentWorkLevel, plan.targetWorkLevel)}%` }}
            />
          </div>
          <div className="text-center">
            <div className="text-xs text-muted">目標</div>
            <div className="font-bold text-violet-soft">
              {plan.targetLevel} / Lv.{plan.targetWorkLevel}
            </div>
            <div className="text-[10px] text-muted">{WORK_LEVEL_LABEL[plan.targetWorkLevel]}</div>
          </div>
        </div>
      </Panel>

      {/* 前回言えなかった表現 */}
      {couldNotSay.length > 0 && (
        <Panel className="p-4">
          <SectionTitle label="前回、言えなかった表現" sub="復習で潰そう" icon={<IconRefresh width={16} height={16} />} />
          <ul className="space-y-2">
            {couldNotSay.map((p) => (
              <li key={p.id} className="rounded-lg border border-white/5 bg-navy-700/40 px-3 py-2">
                <div className="text-sm text-cyan-soft">{p.english}</div>
                <div className="text-xs text-muted">{p.japanese}</div>
              </li>
            ))}
          </ul>
          <Link href="/review" className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-soft hover:underline">
            復習へ <IconArrowRight width={14} height={14} />
          </Link>
        </Panel>
      )}

      {/* クイックリンク */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <QuickLink href="/roleplay" label="ロールプレイ" icon={<IconChat />} />
        <QuickLink href="/phrases" label="仕事フレーズ" icon={<IconCards />} />
        <QuickLink href="/review" label="復習" icon={<IconRefresh />} badge={dueCount} />
      </div>
    </div>
  );
}

function levelDistance(cur: number, target: number): number {
  const span = Math.max(1, target - 1);
  return Math.min(100, Math.round(((cur - 1) / span) * 100));
}

function QuickLink({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <Panel hover className="flex items-center gap-2 px-4 py-3.5">
        <span className="text-cyan-core">{icon}</span>
        <span className="text-sm text-ink">{label}</span>
        {badge ? (
          <span className="ml-auto rounded-full bg-cyan-core/20 px-2 py-0.5 text-[10px] text-cyan-soft">
            {badge}
          </span>
        ) : null}
      </Panel>
    </Link>
  );
}
