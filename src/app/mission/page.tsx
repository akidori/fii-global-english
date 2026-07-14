"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { FiiCoachBubble } from "@/components/fii/FiiCoachBubble";
import { Button, Panel } from "@/components/ui/primitives";
import { AnswerInput } from "@/components/learning/AnswerInput";
import { IconCheck, IconSpeaker, IconArrowRight, IconChat, IconRefresh } from "@/components/ui/icons";
import { SCENARIOS, scenarioById } from "@/data/scenarios";
import { phraseSeedById } from "@/data/phrases";
import { duePhrases } from "@/lib/spaced-repetition";
import { scoreAnswer, averageScore } from "@/lib/scoring";
import { speak, ttsSupported } from "@/lib/speech";
import { cn } from "@/lib/cn";
import type { Phrase } from "@/types";

const REPHRASE_PROMPTS = [
  { jp: "対応できますが、納期に影響する可能性があります。", model: "I can do that, but it may affect the deadline." },
  { jp: "この動画で一番伝えたいことは何ですか？", model: "What's the most important message of this video?" },
];

export default function MissionPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const plan = useLearningStore((s) => s.plan);
  const phrases = useLearningStore((s) => s.phrases);
  const [step, setStep] = useState(0);

  const focusScenario = useMemo(() => {
    if (!plan) return SCENARIOS[0]!;
    return SCENARIOS.find((s) => s.scene === plan.focusScene) ?? SCENARIOS[0]!;
  }, [plan]);

  const warmup = useMemo<Phrase[]>(() => {
    const recent = phrases
      .filter((p) => p.source !== "seed")
      .slice(0, 3);
    if (recent.length >= 3) return recent;
    // 足りなければ重点シーンのseedフレーズで補う
    const seeds = focusScenario.keyPhraseIds
      .map(phraseSeedById)
      .filter(Boolean)
      .map(
        (s) =>
          ({
            id: s!.id,
            english: s!.english,
            japanese: s!.japanese,
            category: s!.category,
            source: "seed",
            mastery: 0,
            reviewDate: "",
            mistakeCount: 0,
            createdAt: "",
          }) as Phrase,
      );
    return [...recent, ...seeds].slice(0, 3);
  }, [phrases, focusScenario]);

  const keyPhrases = useMemo(
    () => focusScenario.keyPhraseIds.map(phraseSeedById).filter(Boolean),
    [focusScenario],
  );

  const dueCount = duePhrases(phrases).length;

  const steps = [
    { name: "Warm Up", jp: "前回の表現を口に出す" },
    { name: "Key Phrase", jp: "今日の場面の型" },
    { name: "Roleplay", jp: "Fiiと本番会話" },
    { name: "Rephrase", jp: "短く言い直す" },
    { name: "Review", jp: "取りこぼしを保存" },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <FiiAvatar state="idle" size={68} float={false} />
        <div>
          <h1 className="text-lg font-bold text-ink">今日のミッション</h1>
          <p className="text-xs text-muted">
            テーマ「{focusScenario.title}」・{plan?.dailyMinutes ?? 15}分
          </p>
        </div>
      </div>

      {/* ステップインジケータ */}
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setStep(i)}
            className={cn(
              "flex-1 rounded-full py-1 text-center text-[10px] transition-all",
              i === step
                ? "bg-cyan-core/20 text-cyan-soft shadow-glow"
                : i < step
                  ? "bg-cyan-core/10 text-cyan-soft/60"
                  : "bg-white/5 text-muted",
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      <Panel className="p-5 animate-pop-in">
        {step === 0 && (
          <StepShadow
            title="1. Warm Up — 前回の表現を声に出す"
            phrases={warmup}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepShadow
            title="2. Key Phrase — 今日の場面で使う型"
            phrases={keyPhrases.map(
              (s) =>
                ({
                  id: s!.id,
                  english: s!.english,
                  japanese: s!.japanese,
                }) as Pick<Phrase, "id" | "english" | "japanese">,
            )}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <div className="text-center">
            <h2 className="mb-2 text-base font-semibold text-ink">3. Roleplay — Fiiと本番</h2>
            <FiiCoachBubble className="mb-4 text-left">
              ここが本番。完璧じゃなくていい、止まらないことだけ意識して。
            </FiiCoachBubble>
            <Link href={`/roleplay/${focusScenario.id}`}>
              <Button className="w-full">
                <IconChat width={18} height={18} /> 「{focusScenario.title}」を始める
              </Button>
            </Link>
            <button onClick={() => setStep(3)} className="mt-3 text-xs text-muted hover:text-cyan-soft">
              ロールプレイを終えたら次へ →
            </button>
          </div>
        )}
        {step === 3 && <StepRephrase onNext={() => setStep(4)} />}
        {step === 4 && (
          <div className="text-center">
            <h2 className="mb-2 text-base font-semibold text-ink">5. Review — 取りこぼしを潰す</h2>
            <FiiCoachBubble className="mb-4 text-left">
              言えなかった表現は財産だよ。間隔をあけて何度も出すから、任せて。
            </FiiCoachBubble>
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted">
              <IconRefresh width={16} height={16} className="text-cyan-core" />
              復習待ち <span className="font-bold text-cyan-soft">{dueCount}</span> 件
            </div>
            <Link href="/review">
              <Button variant="outline" className="w-full">
                復習へ <IconArrowRight width={16} height={16} />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="mt-2 w-full">
                今日のミッション完了 <IconCheck width={16} height={16} />
              </Button>
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StepShadow({
  title,
  phrases,
  onNext,
}: {
  title: string;
  phrases: Pick<Phrase, "id" | "english" | "japanese">[];
  onNext: () => void;
}) {
  const [heard, setHeard] = useState<Set<string>>(new Set());
  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>
      {phrases.length === 0 ? (
        <p className="text-sm text-muted">まだ表現がありません。ロールプレイで貯めよう。</p>
      ) : (
        <div className="space-y-2">
          {phrases.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                speak(p.english);
                setHeard((s) => new Set(s).add(p.id));
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all",
                heard.has(p.id) ? "border-cyan-core/50 bg-cyan-core/10" : "border-white/8 bg-navy-700/40",
              )}
            >
              <div>
                <div className="text-sm text-cyan-soft">{p.english}</div>
                <div className="text-[11px] text-muted">{p.japanese}</div>
              </div>
              {ttsSupported() ? (
                <IconSpeaker width={16} height={16} className="text-cyan-soft/70" />
              ) : (
                heard.has(p.id) && <IconCheck width={16} height={16} className="text-cyan-core" />
              )}
            </button>
          ))}
        </div>
      )}
      <Button className="mt-4 w-full" onClick={onNext}>
        次へ <IconArrowRight width={16} height={16} />
      </Button>
    </div>
  );
}

function StepRephrase({ onNext }: { onNext: () => void }) {
  const [i, setI] = useState(0);
  const [result, setResult] = useState<{ score: number; model: string } | null>(null);
  const p = REPHRASE_PROMPTS[i]!;

  return (
    <div>
      <h2 className="mb-2 text-base font-semibold text-ink">4. Rephrase — 短く言い直す</h2>
      <p className="mb-3 text-xs text-muted">日本語を、できるだけ短い英語で。</p>
      <div className="mb-3 rounded-xl border border-violet-core/25 bg-violet-core/5 px-3 py-2 text-sm text-ink">
        {p.jp}
      </div>
      {!result ? (
        <AnswerInput
          autoFocusKey={i}
          placeholder="短い英語で…"
          submitLabel="言えた"
          onSubmit={(text) => setResult({ score: averageScore(scoreAnswer({ text })), model: p.model })}
        />
      ) : (
        <div className="animate-pop-in">
          <FiiCoachBubble english={result.model}>
            {result.score >= 70 ? "いいね、伝わる。" : "OK、でももっと短くできる。"}
            <br />
            <span className="text-cyan-soft">モデル: {result.model}</span>
          </FiiCoachBubble>
          <Button
            className="mt-3 w-full"
            onClick={() => {
              if (i + 1 < REPHRASE_PROMPTS.length) {
                setI(i + 1);
                setResult(null);
              } else {
                onNext();
              }
            }}
          >
            {i + 1 < REPHRASE_PROMPTS.length ? "次のお題" : "次のステップへ"}{" "}
            <IconArrowRight width={16} height={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
