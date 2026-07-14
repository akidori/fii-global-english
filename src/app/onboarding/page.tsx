"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLearningStore } from "@/store/use-learning-store";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { FiiCoachBubble } from "@/components/fii/FiiCoachBubble";
import { Button, Panel } from "@/components/ui/primitives";
import { IconArrowRight, IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type {
  Deadline,
  WeeklyMinutes,
  PriorityScene,
  Weakness,
  LearningStyle,
  DailyLoad,
  UserProfile,
} from "@/types";
import { todayISO } from "@/lib/date";

interface Opt<T> {
  value: T;
  label: string;
  sub?: string;
}

interface Step {
  key: keyof Draft;
  question: string;
  fii: string;
  opts: Opt<string>[];
}

interface Draft {
  deadline?: Deadline;
  weeklyMinutes?: WeeklyMinutes;
  priorityScene?: PriorityScene;
  weakness?: Weakness;
  learningStyle?: LearningStyle;
  dailyLoad?: DailyLoad;
}

const STEPS: Step[] = [
  {
    key: "deadline",
    question: "いつまでに英語を仕事で使えるようになりたい？",
    fii: "ゴールの日付を決めよう。決めないと人は動かないからね。",
    opts: [
      { value: "3m", label: "3か月", sub: "本気で詰める" },
      { value: "6m", label: "6か月", sub: "現実的な標準" },
      { value: "1y", label: "1年", sub: "じっくり土台から" },
    ],
  },
  {
    key: "weeklyMinutes",
    question: "1週間に現実的に使える学習時間は？",
    fii: "見栄を張らないで。続く量を選ぶのが正解。",
    opts: [
      { value: "75", label: "75分/週" },
      { value: "120", label: "120分/週" },
      { value: "180", label: "180分/週" },
      { value: "300", label: "300分/週" },
    ],
  },
  {
    key: "priorityScene",
    question: "最初に英語でできるようになりたい仕事は？",
    fii: "全部やろうとすると沈む。まず1つに集中するよ。",
    opts: [
      { value: "intro_portfolio", label: "自己紹介とポートフォリオ説明" },
      { value: "first_meeting", label: "海外クライアントとの初回商談" },
      { value: "plan_direction", label: "企画・構成・演出意図の説明" },
      { value: "on_set", label: "撮影現場での指示" },
      { value: "revision", label: "修正依頼への対応" },
      { value: "negotiation", label: "価格・納期・修正範囲の交渉" },
    ],
  },
  {
    key: "weakness",
    question: "今いちばん苦手だと思うことは？",
    fii: "弱点は恥じゃない。ここを潰すのが最短ルート。",
    opts: [
      { value: "cant_speak_fast", label: "英語がすぐに出てこない" },
      { value: "cant_listen", label: "相手の英語を聞き取れない" },
      { value: "grammar", label: "文法が不安" },
      { value: "pronunciation", label: "発音に自信がない" },
      { value: "nervous", label: "緊張して話せない" },
      { value: "cant_explain_work", label: "自分の仕事を説明できない" },
    ],
  },
  {
    key: "learningStyle",
    question: "いちばん続けやすい学習方法は？",
    fii: "続く形が最強。君に合うやり方でいこう。",
    opts: [
      { value: "voice", label: "音声で会話する" },
      { value: "roleplay", label: "ロールプレイ中心" },
      { value: "text", label: "字幕と文章で覚える" },
      { value: "real_material", label: "実際の案件資料を使う" },
      { value: "balanced", label: "バランス型" },
    ],
  },
  {
    key: "dailyLoad",
    question: "1日の学習負荷は？",
    fii: "毎日やる前提でね。軽くていい、途切れないことが全て。",
    opts: [
      { value: "light", label: "10分・軽め" },
      { value: "standard", label: "15分・標準" },
      { value: "focus", label: "25分・集中" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const saveProfile = useLearningStore((s) => s.saveProfile);
  const existing = useLearningStore((s) => s.profile);

  const [phase, setPhase] = useState<"intro" | number>(existing ? 0 : "intro");
  const [draft, setDraft] = useState<Draft>({});

  const total = STEPS.length;
  const stepIndex = typeof phase === "number" ? phase : -1;
  const step = stepIndex >= 0 ? STEPS[stepIndex] : null;

  const progress = useMemo(
    () => (stepIndex >= 0 ? (stepIndex / total) * 100 : 0),
    [stepIndex, total],
  );

  function choose(value: string) {
    if (!step) return;
    const nextDraft = { ...draft, [step.key]: value } as Draft;
    setDraft(nextDraft);
    if (stepIndex + 1 < total) {
      setPhase(stepIndex + 1);
    } else {
      finish(nextDraft);
    }
  }

  function finish(d: Draft) {
    const profile: UserProfile = {
      name: "中村諭律",
      roles: [
        "映像ディレクター",
        "YouTube運用ディレクター",
        "ドキュメンタリー制作者",
        "営業",
        "経営者",
      ],
      goal: "海外クライアントと英語で案件を獲得し、ヒアリングから納品まで自力で完遂する",
      deadline: d.deadline ?? "6m",
      weeklyMinutes: (Number(d.weeklyMinutes) as WeeklyMinutes) || 120,
      dailyLoad: d.dailyLoad ?? "standard",
      priorityScene: d.priorityScene ?? "first_meeting",
      weakness: d.weakness ?? "cant_speak_fast",
      learningStyle: d.learningStyle ?? "balanced",
      createdAt: todayISO(),
    };
    saveProfile(profile);
    router.push("/assessment");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
      {phase === "intro" ? (
        <div className="flex flex-col items-center gap-6 text-center animate-pop-in">
          <FiiAvatar state="happy" size={150} />
          <div>
            <h1 className="text-2xl font-bold text-ink glow-text">Fii Global English</h1>
            <p className="mt-2 text-sm text-muted">
              試験じゃなくて、海外案件で戦うための英語。<br />
              ヒアリングから納品まで、英語で自分で回せるようにする。
            </p>
          </div>
          <FiiCoachBubble className="max-w-md text-left">
            はじめまして、Fii。君の英語コーチだよ。<br />
            正直、最初はできなくて当たり前。でも毎日ちょっとずつやれば、
            半年後には海外クライアントと普通に話せてる。まず6つだけ質問させて。
          </FiiCoachBubble>
          <Button onClick={() => setPhase(0)} className="px-8">
            はじめる <IconArrowRight width={18} height={18} />
          </Button>
        </div>
      ) : (
        step && (
          <div className="animate-pop-in">
            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-cyan-core/10">
              <div
                className="h-full rounded-full bg-cyan-core transition-all"
                style={{ width: `${progress}%`, boxShadow: "0 0 8px rgba(69,205,255,0.7)" }}
              />
            </div>
            <div className="mb-5 flex items-start gap-3">
              <FiiAvatar state="thinking" size={72} float={false} />
              <FiiCoachBubble className="flex-1">{step.fii}</FiiCoachBubble>
            </div>
            <h2 className="mb-4 text-lg font-semibold text-ink">
              <span className="mr-2 font-mono text-sm text-cyan-soft/60">
                {stepIndex + 1}/{total}
              </span>
              {step.question}
            </h2>
            <div className="grid gap-2.5">
              {step.opts.map((o) => {
                const selected = draft[step.key] === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => choose(o.value)}
                    className={cn(
                      "panel panel-hover flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all",
                      selected && "border-cyan-core",
                    )}
                  >
                    <span>
                      <span className="text-sm font-medium text-ink">{o.label}</span>
                      {o.sub && <span className="ml-2 text-xs text-muted">{o.sub}</span>}
                    </span>
                    <IconArrowRight width={16} height={16} className="text-cyan-soft/50" />
                  </button>
                );
              })}
            </div>
            {stepIndex > 0 && (
              <button
                onClick={() => setPhase(stepIndex - 1)}
                className="mt-5 text-xs text-muted hover:text-cyan-soft"
              >
                ← 戻る
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
