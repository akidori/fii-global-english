"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { Panel, Button, SectionTitle, Chip } from "@/components/ui/primitives";
import { dailyGoalByLoad } from "@/lib/gamification";
import { SCENE_LABEL } from "@/lib/plan-generator";
import { cn } from "@/lib/cn";
import type { AppMode } from "@/types";

export default function SettingsPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const router = useRouter();
  const mode = useLearningStore((s) => s.mode);
  const setMode = useLearningStore((s) => s.setMode);
  const g = useLearningStore((s) => s.gamification);
  const setDailyGoal = useLearningStore((s) => s.setDailyGoal);
  const profile = useLearningStore((s) => s.profile);
  const resetAll = useLearningStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-bold text-ink">設定</h1>

      {/* モード */}
      <Panel className="p-4">
        <SectionTitle label="学習モード" sub="mock はAPIキー不要で全機能動作。ai はOpenAIで会話・評価。" />
        <div className="flex gap-2">
          {(["mock", "ai"] as AppMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-xl border px-4 py-3 text-sm transition-all",
                mode === m ? "border-cyan-core bg-cyan-core/15 text-cyan-soft shadow-glow" : "border-white/10 text-muted",
              )}
            >
              <div className="font-semibold">{m === "mock" ? "Mock" : "AI"}</div>
              <div className="text-[11px] opacity-70">{m === "mock" ? "鍵不要・即動作" : "OpenAI接続"}</div>
            </button>
          ))}
        </div>
        {mode === "ai" && (
          <p className="mt-2 rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-[11px] text-amber-200/80">
            AIモードはサーバに OPENAI_API_KEY が必要です。未設定の場合は自動的に mock 評価にフォールバックします（会話は止まりません）。
          </p>
        )}
      </Panel>

      {/* デイリーゴール */}
      <Panel className="p-4">
        <SectionTitle label="1日の学習負荷" />
        <div className="flex gap-2">
          {(Object.keys(dailyGoalByLoad) as (keyof typeof dailyGoalByLoad)[]).map((load) => {
            const min = dailyGoalByLoad[load];
            return (
              <Chip key={load} active={g.dailyGoalMinutes === min} onClick={() => setDailyGoal(min)}>
                {min}分（{load === "light" ? "軽め" : load === "standard" ? "標準" : "集中"}）
              </Chip>
            );
          })}
        </div>
      </Panel>

      {/* プロフィール */}
      {profile && (
        <Panel className="p-4">
          <SectionTitle label="プロフィール" />
          <dl className="space-y-1 text-sm">
            <Row k="名前" v={profile.name} />
            <Row k="重点シーン" v={SCENE_LABEL[profile.priorityScene]} />
            <Row k="週の学習時間" v={`${profile.weeklyMinutes}分`} />
            <Row k="期限" v={{ "3m": "3か月", "6m": "6か月", "1y": "1年" }[profile.deadline]} />
          </dl>
          <Button variant="ghost" className="mt-2 px-0 text-xs" onClick={() => router.push("/onboarding")}>
            オンボーディングをやり直す
          </Button>
        </Panel>
      )}

      {/* データ */}
      <Panel className="p-4">
        <SectionTitle label="データ" sub="すべてこの端末のブラウザ(LocalStorage)に保存されています。" />
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            学習データをすべて消去
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-rose-200/80">本当に消去しますか？この操作は元に戻せません。</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                やめる
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetAll();
                  router.replace("/onboarding");
                }}
              >
                消去して最初から
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <p className="text-center text-[11px] text-muted/50">Fii Global English · v0.1 · mode: {mode}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-1">
      <dt className="text-muted">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}
