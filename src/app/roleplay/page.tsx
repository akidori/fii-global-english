"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SCENARIOS } from "@/data/scenarios";
import { Panel, SectionTitle, Chip } from "@/components/ui/primitives";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { IconChat, IconArrowRight, IconLock } from "@/components/ui/icons";
import { useLearningStore } from "@/store/use-learning-store";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

const DIFF_LABEL: Record<number, string> = {
  1: "選択式",
  2: "穴埋め/基礎",
  3: "短文入力",
  4: "自由回答",
  5: "追加質問あり",
  6: "予測不能",
};

export default function RoleplayListPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const plan = useLearningStore((s) => s.plan);
  const [filter, setFilter] = useState<"all" | "focus">("all");

  const list = useMemo(() => {
    const all = [...SCENARIOS].sort((a, b) => a.difficulty - b.difficulty);
    if (filter === "focus" && plan) {
      return all.filter((s) => s.scene === plan.focusScene);
    }
    return all;
  }, [filter, plan]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FiiAvatar state="idle" size={72} float={false} />
        <div>
          <h1 className="text-lg font-bold text-ink">ロールプレイ</h1>
          <p className="text-sm text-muted">Fii がクライアント役。実際の仕事場面で英語を回す。</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          すべて
        </Chip>
        {plan && (
          <Chip active={filter === "focus"} onClick={() => setFilter("focus")}>
            今週の重点だけ
          </Chip>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((s) => (
          <Link key={s.id} href={`/roleplay/${s.id}`}>
            <Panel hover className="h-full p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-cyan-soft/70">
                  <IconChat width={14} height={14} />
                  難易度 {s.difficulty} · {DIFF_LABEL[s.difficulty]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    "bg-violet-core/15 text-violet-soft",
                  )}
                >
                  {s.titleEn}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 text-xs text-muted">{s.goal}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-cyan-soft">
                開始 <IconArrowRight width={14} height={14} />
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
