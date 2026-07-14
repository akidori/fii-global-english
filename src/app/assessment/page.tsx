"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLearningStore } from "@/store/use-learning-store";
import { ASSESSMENT_QUESTIONS, type AssessmentQuestion } from "@/data/assessment";
import { AnswerInput } from "@/components/learning/AnswerInput";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { FiiCoachBubble } from "@/components/fii/FiiCoachBubble";
import { Button, Panel, ProgressRing } from "@/components/ui/primitives";
import { IconCheck, IconArrowRight, IconSpeaker } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { scoreAnswer, averageScore, aggregateAssessment, estimateLevel } from "@/lib/scoring";
import { DIMENSION_LABEL, CEFR_MEANING, WORK_LEVEL_LABEL, WORK_LEVEL_JP } from "@/lib/labels";
import { speak, ttsSupported } from "@/lib/speech";
import type { AssessmentAnswer, Assessment, AssessmentDimension } from "@/types";
import { todayISO } from "@/lib/date";

export default function AssessmentPage() {
  const router = useRouter();
  const profile = useLearningStore((s) => s.profile);
  const completeAssessment = useLearningStore((s) => s.completeAssessment);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [result, setResult] = useState<Assessment | null>(null);

  const total = ASSESSMENT_QUESTIONS.length;
  const q = ASSESSMENT_QUESTIONS[idx];

  function record(a: AssessmentAnswer) {
    const next = [...answers, a];
    setAnswers(next);
    if (idx + 1 < total) {
      setIdx(idx + 1);
    } else {
      finalize(next);
    }
  }

  function finalize(all: AssessmentAnswer[]) {
    const scores = aggregateAssessment(all);
    const { level, workLevel } = estimateLevel(scores);
    const assessment: Assessment = {
      level,
      workLevel,
      scores,
      answers: all,
      completedAt: todayISO(),
    };
    completeAssessment(assessment);
    setResult(assessment);
  }

  if (result) return <ResultView result={result} onNext={() => router.push("/dashboard")} />;

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <FiiAvatar state="thinking" size={120} />
        <p className="mt-4 text-sm text-muted">先にオンボーディングを済ませてね。</p>
        <Button className="mt-4" onClick={() => router.push("/onboarding")}>
          オンボーディングへ
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-cyan-core/10">
        <div
          className="h-full rounded-full bg-cyan-core transition-all"
          style={{ width: `${(idx / total) * 100}%`, boxShadow: "0 0 8px rgba(69,205,255,0.7)" }}
        />
      </div>
      <div className="mb-4 flex items-center gap-2 text-xs text-cyan-soft/70">
        <FiiAvatar state="thinking" size={48} float={false} />
        <span>英語力診断 {idx + 1} / {total} — できなくて当たり前。今の実力を測るだけ。</span>
      </div>
      {q && <QuestionView key={q.id} q={q} onAnswer={record} />}
    </div>
  );
}

function QuestionView({
  q,
  onAnswer,
}: {
  q: AssessmentQuestion;
  onAnswer: (a: AssessmentAnswer) => void;
}) {
  const [slider, setSlider] = useState(50);

  return (
    <Panel className="p-5 animate-pop-in">
      <h2 className="text-base font-semibold text-ink">{q.title}</h2>
      {q.jp && <p className="mt-1 text-xs text-muted">{q.jp}</p>}

      {q.english && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-core/20 bg-navy-700/60 px-3 py-2">
          <p className="flex-1 text-sm text-cyan-soft">{q.english}</p>
          {ttsSupported() && (
            <button
              onClick={() => speak(q.english!)}
              className="rounded-lg p-1 text-cyan-soft hover:bg-cyan-core/15"
              aria-label="読み上げる"
            >
              <IconSpeaker width={16} height={16} />
            </button>
          )}
        </div>
      )}
      {q.hint && <p className="mt-2 text-xs text-violet-soft/80">ヒント: {q.hint}</p>}

      <div className="mt-4">
        {q.kind === "free" && (
          <AnswerInput
            autoFocusKey={q.id}
            placeholder={q.placeholder}
            submitLabel="回答する"
            onSubmit={(text) => {
              const s = averageScore(scoreAnswer({ text }));
              onAnswer({ questionId: q.id, value: text, selfRatedScore: s });
            }}
          />
        )}

        {q.kind === "choice" && (
          <div className="grid gap-2">
            {q.options?.map((o) => (
              <button
                key={o.id}
                onClick={() =>
                  onAnswer({
                    questionId: q.id,
                    value: o.id,
                    selfRatedScore: o.correct ? 92 : 34,
                  })
                }
                className="panel panel-hover flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-ink"
              >
                {o.label}
                <IconArrowRight width={15} height={15} className="text-cyan-soft/40" />
              </button>
            ))}
          </div>
        )}

        {q.kind === "slider" && (
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              <span>{q.sliderLabels?.[0]}</span>
              <span>{q.sliderLabels?.[1]}</span>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => onAnswer({ questionId: q.id, value: String(slider), selfRatedScore: slider })}
            >
              これで回答 <IconCheck width={16} height={16} />
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function ResultView({ result, onNext }: { result: Assessment; onNext: () => void }) {
  const dims = Object.keys(result.scores) as AssessmentDimension[];
  const avg = averageScore(result.scores);
  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <div className="flex flex-col items-center gap-4 text-center animate-pop-in">
        <FiiAvatar state="master" size={130} />
        <h1 className="text-xl font-bold text-ink glow-text">診断完了</h1>
        <div className="flex items-center gap-4">
          <ProgressRing ratio={avg / 100} size={110}>
            <div className="text-2xl font-bold text-cyan-soft glow-text">{result.level}</div>
            <div className="text-[10px] text-muted">CEFR</div>
          </ProgressRing>
          <Panel className="px-4 py-3 text-left">
            <div className="text-[11px] text-muted">実務レベル</div>
            <div className="text-lg font-bold text-violet-soft">
              Lv.{result.workLevel} {WORK_LEVEL_LABEL[result.workLevel]}
            </div>
            <div className="mt-1 text-xs text-muted">{WORK_LEVEL_JP[result.workLevel]}</div>
          </Panel>
        </div>
        <p className="text-sm text-muted">{CEFR_MEANING[result.level]}</p>
      </div>

      <FiiCoachBubble className="mt-6">
        現在地が見えたね。ここがスタートライン。<br />
        君の弱点と目標に合わせた学習プランを作っておいた。今日から1日ずつ潰していこう。
      </FiiCoachBubble>

      <Panel className="mt-4 p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">能力別スコア</h3>
        <div className="space-y-2.5">
          {dims.map((d) => (
            <div key={d} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted">{DIMENSION_LABEL[d]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-cyan-core/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-core to-violet-core"
                  style={{ width: `${result.scores[d] ?? 0}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-cyan-soft">{result.scores[d] ?? 0}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Button className="mt-6 w-full" onClick={onNext}>
        学習プランとダッシュボードへ <IconArrowRight width={18} height={18} />
      </Button>
    </div>
  );
}
