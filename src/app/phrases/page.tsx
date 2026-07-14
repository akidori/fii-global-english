"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { Panel, Button, Chip, SectionTitle } from "@/components/ui/primitives";
import { IconSpeaker, IconPlus, IconTrash, IconCards } from "@/components/ui/icons";
import { speak, ttsSupported } from "@/lib/speech";
import { makePhrase } from "@/lib/spaced-repetition";
import { seedPhrases } from "@/data/phrases";
import type { Phrase, PhraseCategory } from "@/types";
import { cn } from "@/lib/cn";

const CAT_LABEL: Record<PhraseCategory, string> = {
  keep_going: "会話を止めない",
  intro: "自己紹介",
  portfolio: "ポートフォリオ",
  hearing: "ヒアリング",
  planning: "企画・演出",
  on_set: "撮影現場",
  interview: "インタビュー",
  editing: "編集意図",
  revision: "修正対応",
  negotiation: "交渉",
  smalltalk: "雑談",
};

export default function PhrasesPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const phrases = useLearningStore((s) => s.phrases);
  const upsertPhrase = useLearningStore((s) => s.upsertPhrase);
  const removePhrase = useLearningStore((s) => s.removePhrase);
  const [cat, setCat] = useState<PhraseCategory | "all" | "learned">("all");
  const [adding, setAdding] = useState(false);

  // seed を表示に混ぜる（保存済みが優先。重複英文は除外）
  const all = useMemo<Phrase[]>(() => {
    const saved = phrases;
    const seedList = seedPhrases().filter(
      (s) => !saved.some((p) => p.english.toLowerCase() === s.english.toLowerCase()),
    );
    return [...saved, ...seedList];
  }, [phrases]);

  const cats = useMemo(
    () => Array.from(new Set(all.map((p) => p.category))) as PhraseCategory[],
    [all],
  );

  const list = useMemo(() => {
    if (cat === "all") return all;
    if (cat === "learned") return all.filter((p) => p.mastery >= 4);
    return all.filter((p) => p.category === cat);
  }, [all, cat]);

  const learnedCount = all.filter((p) => p.mastery >= 4).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ink">仕事フレーズ</h1>
          <p className="text-xs text-muted">
            実務で使える表現を貯める。習得 {learnedCount} / {all.length}
          </p>
        </div>
        <Button variant="outline" onClick={() => setAdding((a) => !a)} className="px-3 py-2 text-xs">
          <IconPlus width={16} height={16} /> 追加
        </Button>
      </div>

      {adding && <AddPhrase onAdd={(p) => (upsertPhrase(p), setAdding(false))} />}

      <div className="flex flex-wrap gap-2">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          すべて
        </Chip>
        <Chip active={cat === "learned"} onClick={() => setCat("learned")}>
          習得済み
        </Chip>
        {cats.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {CAT_LABEL[c]}
          </Chip>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((p) => (
          <Panel key={p.id} className="flex items-start justify-between gap-2 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-cyan-soft">{p.english}</span>
                <MasteryDots mastery={p.mastery} />
              </div>
              <div className="text-[11px] text-muted">{p.japanese}</div>
              <div className="mt-1 text-[10px] text-muted/60">{CAT_LABEL[p.category]}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              {ttsSupported() && (
                <button onClick={() => speak(p.english)} className="rounded-lg p-1.5 text-cyan-soft/70 hover:bg-cyan-core/10">
                  <IconSpeaker width={15} height={15} />
                </button>
              )}
              {p.source !== "seed" && (
                <button onClick={() => removePhrase(p.id)} className="rounded-lg p-1.5 text-muted hover:text-rose-200">
                  <IconTrash width={15} height={15} />
                </button>
              )}
            </div>
          </Panel>
        ))}
      </div>
      {list.length === 0 && (
        <div className="py-10 text-center text-sm text-muted">
          <IconCards width={28} height={28} className="mx-auto mb-2 text-cyan-core/50" />
          このカテゴリの表現はまだありません。
        </div>
      )}
    </div>
  );
}

function MasteryDots({ mastery }: { mastery: number }) {
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn("h-1.5 w-1.5 rounded-full", i < mastery ? "bg-cyan-core" : "bg-white/15")}
        />
      ))}
    </span>
  );
}

function AddPhrase({ onAdd }: { onAdd: (p: Phrase) => void }) {
  const [en, setEn] = useState("");
  const [jp, setJp] = useState("");
  const [category, setCategory] = useState<PhraseCategory>("keep_going");
  return (
    <Panel className="space-y-2 p-4">
      <SectionTitle label="フレーズを追加" />
      <input
        value={en}
        onChange={(e) => setEn(e.target.value)}
        placeholder="English phrase"
        className="w-full rounded-lg border border-white/10 bg-navy-700/60 px-3 py-2 text-sm text-ink focus:border-cyan-core focus:outline-none"
      />
      <input
        value={jp}
        onChange={(e) => setJp(e.target.value)}
        placeholder="日本語の意味"
        className="w-full rounded-lg border border-white/10 bg-navy-700/60 px-3 py-2 text-sm text-ink focus:border-cyan-core focus:outline-none"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as PhraseCategory)}
        className="w-full rounded-lg border border-white/10 bg-navy-700/60 px-3 py-2 text-sm text-ink focus:border-cyan-core focus:outline-none"
      >
        {(Object.keys(CAT_LABEL) as PhraseCategory[]).map((c) => (
          <option key={c} value={c} className="bg-navy-800">
            {CAT_LABEL[c]}
          </option>
        ))}
      </select>
      <Button
        className="w-full"
        disabled={!en.trim()}
        onClick={() => onAdd(makePhrase({ english: en.trim(), japanese: jp.trim() || "—", category, source: "saved" }))}
      >
        保存する
      </Button>
    </Panel>
  );
}
