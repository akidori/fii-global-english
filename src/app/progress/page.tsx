"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { Panel, Stat, SectionTitle } from "@/components/ui/primitives";
import { IconFlame, IconBolt, IconStar, IconChat, IconChart } from "@/components/ui/icons";
import { levelProgress } from "@/lib/gamification";
import { AXIS_LABEL } from "@/lib/labels";
import { jpWeekday, todayISO, addDaysISO } from "@/lib/date";
import type { EvaluationAxis } from "@/types";

export default function ProgressPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const g = useLearningStore((s) => s.gamification);
  const sessions = useLearningStore((s) => s.sessions);
  const logs = useLearningStore((s) => s.dailyLogs);
  const lp = levelProgress(g.xp);

  // 直近14日の分数バー
  const last14 = useMemo(() => {
    const days: { date: string; minutes: number; xp: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = addDaysISO(todayISO(), -i);
      const log = logs.find((l) => l.date === date);
      days.push({ date, minutes: log?.minutes ?? 0, xp: log?.xp ?? 0 });
    }
    return days;
  }, [logs]);
  const maxMin = Math.max(15, ...last14.map((d) => d.minutes));

  // 能力別の直近平均（最新10セッション）
  const axisAvg = useMemo(() => {
    const totals: Partial<Record<EvaluationAxis, number[]>> = {};
    for (const s of sessions.slice(0, 10)) {
      (Object.keys(s.scores) as EvaluationAxis[]).forEach((ax) => {
        const v = s.scores[ax];
        if (typeof v === "number") (totals[ax] ??= []).push(v);
      });
    }
    const out: { axis: EvaluationAxis; value: number }[] = [];
    (Object.keys(totals) as EvaluationAxis[]).forEach((ax) => {
      const arr = totals[ax]!;
      out.push({ axis: ax, value: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) });
    });
    return out.sort((a, b) => b.value - a.value);
  }, [sessions]);

  const totalMinutes = logs.reduce((a, l) => a + l.minutes, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FiiAvatar state={g.streakDays >= 3 ? "happy" : "idle"} size={64} float={false} />
        <div>
          <h1 className="text-lg font-bold text-ink">成長記録</h1>
          <p className="text-xs text-muted">数字と履歴で伸びを可視化する。</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<IconFlame width={20} height={20} />} value={g.streakDays} label="連続日数" accent="amber" />
        <Stat icon={<IconBolt width={20} height={20} />} value={g.xp} label="累計XP" />
        <Stat icon={<IconStar width={20} height={20} />} value={`Lv.${lp.level}`} label="レベル" accent="violet" />
        <Stat icon={<IconChat width={20} height={20} />} value={g.totalSessions} label="セッション" />
      </div>

      <Panel className="p-4">
        <SectionTitle label="学習量（直近14日）" sub={`累計 ${totalMinutes} 分`} icon={<IconChart width={16} height={16} />} />
        <div className="flex h-32 items-end gap-1.5">
          {last14.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-cyan-core/40 to-cyan-core"
                  style={{
                    height: `${(d.minutes / maxMin) * 100}%`,
                    minHeight: d.minutes > 0 ? 4 : 0,
                    boxShadow: d.minutes > 0 ? "0 0 6px rgba(69,205,255,0.5)" : "none",
                  }}
                  title={`${d.date}: ${d.minutes}分`}
                />
              </div>
              <span className="text-[9px] text-muted">{jpWeekday(d.date)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-4">
        <SectionTitle label="能力別スコア（直近の平均）" />
        {axisAvg.length === 0 ? (
          <p className="text-sm text-muted">まだロールプレイの記録がありません。</p>
        ) : (
          <div className="space-y-2">
            {axisAvg.map(({ axis, value }) => (
              <div key={axis} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted">{AXIS_LABEL[axis]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-cyan-core/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-core to-violet-core"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-cyan-soft">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="p-4">
        <SectionTitle label="最近のセッション" />
        {sessions.length === 0 ? (
          <p className="text-sm text-muted">まだ記録がありません。ロールプレイを1本やってみよう。</p>
        ) : (
          <ul className="space-y-2">
            {sessions.slice(0, 8).map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-navy-700/40 px-3 py-2 text-sm">
                <div>
                  <div className="text-ink">{s.scenarioTitle}</div>
                  <div className="text-[11px] text-muted">
                    {s.date} · {Math.round(s.durationSec / 60)}分
                  </div>
                </div>
                <span className="rounded-full bg-cyan-core/15 px-2 py-0.5 text-xs text-cyan-soft">
                  +{s.xpEarned}XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
