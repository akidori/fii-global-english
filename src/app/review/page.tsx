"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { Button, Panel } from "@/components/ui/primitives";
import { IconSpeaker, IconCheck, IconClose, IconRefresh, IconArrowRight } from "@/components/ui/icons";
import { duePhrases, REVIEW_INTERVALS } from "@/lib/spaced-repetition";
import { speak, ttsSupported } from "@/lib/speech";
import { todayISO } from "@/lib/date";

export default function ReviewPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const phrases = useLearningStore((s) => s.phrases);
  const gradePhrase = useLearningStore((s) => s.gradePhrase);

  // セッション開始時点の期限フレーズを固定（採点で消えても最後までやる）
  const [queue] = useState(() => duePhrases(phrases).map((p) => p.id));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  const currentId = queue[pos];
  const current = useMemo(
    () => phrases.find((p) => p.id === currentId),
    [phrases, currentId],
  );

  if (queue.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <FiiAvatar state="sleepy" size={120} />
        <h1 className="mt-4 text-lg font-bold text-ink">今日の復習は完了</h1>
        <p className="mt-2 text-sm text-muted">
          期限が来た表現はありません。間隔反復（当日→翌日→3日→7日→14日→30日）で自動的に出すよ。
        </p>
        <Link href="/roleplay">
          <Button className="mt-5">ロールプレイで新しい表現を貯める</Button>
        </Link>
      </div>
    );
  }

  if (pos >= queue.length) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <FiiAvatar state="master" size={120} />
        <h1 className="mt-4 text-lg font-bold text-ink glow-text">復習セッション完了</h1>
        <p className="mt-2 text-sm text-muted">
          {done.total}件中 {done.correct}件を思い出せた。忘れたものはすぐまた出すから安心して。
        </p>
        <Link href="/dashboard">
          <Button className="mt-5">
            ダッシュボードへ <IconArrowRight width={16} height={16} />
          </Button>
        </Link>
      </div>
    );
  }

  if (!current) {
    // 既に削除された等 → スキップ
    setPos(pos + 1);
    return null;
  }

  function grade(correct: boolean) {
    gradePhrase(current!.id, correct);
    setDone((d) => ({ correct: d.correct + (correct ? 1 : 0), total: d.total + 1 }));
    setRevealed(false);
    setPos(pos + 1);
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <IconRefresh width={14} height={14} className="text-cyan-core" /> 復習
        </span>
        <span>
          {pos + 1} / {queue.length}
        </span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-cyan-core/10">
        <div
          className="h-full rounded-full bg-cyan-core transition-all"
          style={{ width: `${(pos / queue.length) * 100}%` }}
        />
      </div>

      <Panel className="p-6 text-center animate-pop-in">
        <div className="text-[11px] text-muted">日本語 → 英語で思い出す</div>
        <p className="mt-2 text-lg font-semibold text-ink">{current.japanese}</p>

        {revealed ? (
          <div className="mt-5">
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg text-cyan-soft glow-text">{current.english}</p>
              {ttsSupported() && (
                <button onClick={() => speak(current.english)} className="text-cyan-soft/70">
                  <IconSpeaker width={18} height={18} />
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-muted">思い出せた？</p>
            <div className="mt-2 flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => grade(false)}>
                <IconClose width={16} height={16} /> まだ
              </Button>
              <Button className="flex-1" onClick={() => grade(true)}>
                <IconCheck width={16} height={16} /> 言えた
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-6 w-full" onClick={() => setRevealed(true)}>
            答えを見る
          </Button>
        )}
      </Panel>

      <p className="mt-4 text-center text-[11px] text-muted/60">
        次回出題: 正解で先送り（最大{REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]}日後）、
        不正解で翌日 · 基準日 {todayISO()}
      </p>
    </div>
  );
}
