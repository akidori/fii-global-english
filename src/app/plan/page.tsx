"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { Panel, Button, SectionTitle } from "@/components/ui/primitives";
import { IconCheck, IconLock, IconMap, IconTarget } from "@/components/ui/icons";
import { SCENE_LABEL, currentWeekTheme } from "@/lib/plan-generator";
import { DIMENSION_LABEL, WORK_LEVEL_LABEL, WORK_LEVEL_JP } from "@/lib/labels";
import { diffDays, todayISO } from "@/lib/date";
import { cn } from "@/lib/cn";

const DEADLINE_LABEL: Record<string, string> = { "3m": "3か月", "6m": "6か月", "1y": "1年" };

export default function PlanPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const plan = useLearningStore((s) => s.plan);
  const planStart = useLearningStore((s) => s.planStartDate);
  const g = useLearningStore((s) => s.gamification);

  const weekIndex = useMemo(
    () => (planStart ? Math.floor(diffDays(todayISO(), planStart) / 7) : 0),
    [planStart],
  );

  if (!plan) {
    return (
      <div className="py-12 text-center">
        <FiiAvatar state="thinking" size={110} />
        <p className="mt-4 text-sm text-muted">まだ学習プランがありません。</p>
        <Link href="/assessment">
          <Button className="mt-4">診断してプランを作る</Button>
        </Link>
      </div>
    );
  }

  const theme = currentWeekTheme(plan, weekIndex);
  // フェーズの現在地: レベル進捗を4フェーズにざっくり割り当て
  const activePhase = Math.min(
    3,
    Math.max(0, plan.targetWorkLevel > plan.currentWorkLevel
      ? Math.floor(((g.level - 1) / 6) * 4)
      : 0),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FiiAvatar state="idle" size={64} float={false} />
        <div>
          <h1 className="text-lg font-bold text-ink">学習プラン</h1>
          <p className="text-xs text-muted">君専用に組んだ、海外案件までの地図。</p>
        </div>
      </div>

      {/* ゴールカード */}
      <Panel className="p-5">
        <div className="flex items-center gap-1.5 text-xs text-cyan-soft/70">
          <IconTarget width={14} height={14} /> 最終ゴール
        </div>
        <p className="mt-1 text-sm font-semibold text-ink">{plan.goal}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="期限" value={DEADLINE_LABEL[plan.deadline] ?? plan.deadline} />
          <Field label="現在" value={`${plan.currentLevel} / Lv.${plan.currentWorkLevel}`} />
          <Field label="目標" value={`${plan.targetLevel} / Lv.${plan.targetWorkLevel}`} accent />
          <Field label="ペース" value={`${plan.dailyMinutes}分 × 週${plan.weeklyDays}日`} />
        </div>
        <div className="mt-3 rounded-lg border border-cyan-core/15 bg-navy-700/40 px-3 py-2 text-xs text-muted">
          目標到達像: <span className="text-cyan-soft">{WORK_LEVEL_LABEL[plan.targetWorkLevel]}</span> — {WORK_LEVEL_JP[plan.targetWorkLevel]}
        </div>
      </Panel>

      {/* 今週のテーマ */}
      <Panel className="p-4">
        <SectionTitle label={`今週のテーマ（Week ${weekIndex + 1}）`} sub={SCENE_LABEL[plan.focusScene]} icon={<IconMap width={16} height={16} />} />
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {theme.days.map((d, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-navy-700/40 px-3 py-1.5 text-xs">
              <span className="font-mono text-cyan-soft/60">Day{i + 1}</span>
              <span className="text-ink">{d}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* 重点スキル配分 */}
      <Panel className="p-4">
        <SectionTitle label="重点スキルと配分" />
        <div className="space-y-2">
          {(Object.keys(plan.skillAllocation) as (keyof typeof plan.skillAllocation)[]).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted">{DIMENSION_LABEL[k]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-cyan-core/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-core to-violet-core"
                  style={{ width: `${plan.skillAllocation[k] ?? 0}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-cyan-soft">{plan.skillAllocation[k]}%</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* フェーズ（スキルパス） */}
      <Panel className="p-4">
        <SectionTitle label="4つのフェーズ" sub="会話を止めない → 海外案件の実戦" />
        <ol className="relative space-y-3 pl-6">
          <span className="absolute left-[9px] top-1 bottom-1 w-px bg-cyan-core/20" aria-hidden />
          {plan.phases.map((ph, i) => {
            const state = i < activePhase ? "done" : i === activePhase ? "active" : "locked";
            return (
              <li key={ph.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full border",
                    state === "done" && "border-cyan-core bg-cyan-core/20 text-cyan-core",
                    state === "active" && "border-cyan-core bg-cyan-core text-navy-900 shadow-glow",
                    state === "locked" && "border-white/15 text-muted",
                  )}
                >
                  {state === "locked" ? <IconLock width={11} height={11} /> : <IconCheck width={12} height={12} />}
                </span>
                <div className={cn("text-sm font-semibold", state === "locked" ? "text-muted" : "text-ink")}>
                  Phase {ph.id}: {ph.title}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {ph.goals.map((goInfo, gi) => (
                    <li key={gi} className="text-xs text-muted">
                      ・{goInfo}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </Panel>

      {/* 週間チェック */}
      <Panel className="p-4">
        <SectionTitle label="週間チェック項目" />
        <ul className="space-y-1.5">
          {plan.weeklyChecklist.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ink">
              <span className="grid h-4 w-4 place-items-center rounded border border-cyan-core/40 text-cyan-core">
                <IconCheck width={11} height={11} />
              </span>
              {c}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex justify-center">
        <Link href="/assessment">
          <Button variant="outline">再診断してプランを作り直す</Button>
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted">{label}</div>
      <div className={cn("font-semibold", accent ? "text-violet-soft" : "text-cyan-soft")}>{value}</div>
    </div>
  );
}
