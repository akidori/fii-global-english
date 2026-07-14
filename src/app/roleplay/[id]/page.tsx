"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { scenarioById } from "@/data/scenarios";
import { phraseSeedById } from "@/data/phrases";
import { AnswerInput } from "@/components/learning/AnswerInput";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { FiiCoachBubble } from "@/components/fii/FiiCoachBubble";
import { Button, Panel } from "@/components/ui/primitives";
import {
  IconSpeaker,
  IconCheck,
  IconArrowRight,
  IconClose,
  IconStar,
  IconPhone,
  IconPhoneOff,
  IconText,
  IconMic,
} from "@/components/ui/icons";
import { useLearningStore } from "@/store/use-learning-store";
import { runCoachTurn } from "@/lib/coach-client";
import { averageScore } from "@/lib/scoring";
import { evaluateTurn, nextClientLine } from "@/lib/mock-coach";
import { makePhrase } from "@/lib/spaced-repetition";
import { AXIS_LABEL } from "@/lib/labels";
import {
  speak,
  ttsSupported,
  stopSpeaking,
  startStt,
  sttSupported,
  type SttHandle,
} from "@/lib/speech";
import { cn } from "@/lib/cn";
import type {
  TurnEvaluation,
  EvaluationAxis,
  SessionTurn,
  Scenario,
  Phrase,
  LearningSession,
} from "@/types";

type Item =
  | { kind: "fii"; text: string; jp?: string }
  | { kind: "user"; text: string }
  | { kind: "feedback"; ev: TurnEvaluation };

type CompleteFn = (
  s: Omit<LearningSession, "id" | "xpEarned">,
  extra?: Phrase[],
) => unknown;

// 通話・テキスト両モードで共有: 会話結果をセッションとして記録する。
function completeAndRecord(
  scenario: Scenario,
  turns: SessionTurn[],
  evals: TurnEvaluation[],
  startedAtMs: number,
  complete: CompleteFn,
): void {
  const axisTotals: Partial<Record<EvaluationAxis, number[]>> = {};
  for (const ev of evals) {
    (Object.keys(ev.scores) as EvaluationAxis[]).forEach((ax) => {
      const v = ev.scores[ax];
      if (typeof v === "number") (axisTotals[ax] ??= []).push(v);
    });
  }
  const scores: Partial<Record<EvaluationAxis, number>> = {};
  (Object.keys(axisTotals) as EvaluationAxis[]).forEach((ax) => {
    const arr = axisTotals[ax]!;
    scores[ax] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  });

  const extracted = evals
    .filter((ev) => averageScore(ev.scores) < 65)
    .slice(0, 5)
    .map((ev) =>
      makePhrase({
        english: ev.naturalVersion,
        japanese: "言い直せるように（この場面で詰まった表現）",
        category: scenario.category,
        source: "could_not_say",
      }),
    );

  const durationSec = Math.max(30, Math.round((Date.now() - startedAtMs) / 1000));

  complete(
    {
      date: new Date().toISOString().slice(0, 10),
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      turns,
      scores,
      durationSec,
    },
    extracted,
  );
}

export default function RoleplayPage() {
  return (
    <AppShell>
      <Runner />
    </AppShell>
  );
}

function Runner() {
  const params = useParams<{ id: string }>();
  const scenario = scenarioById(params.id);
  const [mode, setMode] = useState<"text" | "call">("text");
  if (!scenario) {
    return <p className="text-sm text-muted">シナリオが見つかりません。</p>;
  }
  return mode === "call" ? (
    <VoiceCall key="call" scenario={scenario} onSwitchText={() => setMode("text")} />
  ) : (
    <TextSession key="text" scenario={scenario} onSwitchCall={() => setMode("call")} />
  );
}

function TextSession({
  scenario,
  onSwitchCall,
}: {
  scenario: Scenario;
  onSwitchCall: () => void;
}) {
  const router = useRouter();
  const mode = useLearningStore((s) => s.mode);
  const completeSession = useLearningStore((s) => s.completeSession);
  const upsertPhrase = useLearningStore((s) => s.upsertPhrase);

  const [items, setItems] = useState<Item[]>([
    { kind: "fii", text: scenario.opening.fii, jp: scenario.opening.jp },
  ]);
  const [askedCount, setAskedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);

  const startedAt = useRef<number>(Date.now());
  const evals = useRef<TurnEvaluation[]>([]);
  const userTurns = useRef<SessionTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const keyPhrases = useMemo(
    () => scenario.keyPhraseIds.map(phraseSeedById).filter(Boolean),
    [scenario],
  );

  // 冒頭のFii発話を読み上げ
  useEffect(() => {
    if (!muted && ttsSupported()) speak(scenario.opening.fii);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [items]);

  async function onSubmit(text: string, ms: number) {
    if (busy || ended) return;
    setBusy(true);
    setItems((prev) => [...prev, { kind: "user", text }]);
    userTurns.current.push({ role: "user", text, ms });

    const result = await runCoachTurn({
      mode,
      scenario,
      userText: text,
      askedCount,
      ms,
      history: items
        .filter((i): i is Extract<Item, { kind: "fii" | "user" }> => i.kind !== "feedback")
        .map((i) => ({ role: i.kind, text: i.text })),
    });

    evals.current.push(result.evaluation);
    setItems((prev) => [...prev, { kind: "feedback", ev: result.evaluation }]);

    if (result.nextLine) {
      const line = result.nextLine;
      setItems((prev) => [...prev, { kind: "fii", text: line.fii, jp: line.jp }]);
      setAskedCount((c) => c + 1);
      if (!muted && ttsSupported()) speak(line.fii);
    } else {
      setEnded(true);
    }
    setBusy(false);
  }

  function saveNatural(ev: TurnEvaluation) {
    upsertPhrase(
      makePhrase({
        english: ev.naturalVersion,
        japanese: "自然な言い方（自分で言い直した表現）",
        category: scenario.category,
        source: "saved",
      }),
    );
  }

  function finish() {
    const turns: SessionTurn[] = items
      .filter((i): i is Extract<Item, { kind: "fii" | "user" }> => i.kind !== "feedback")
      .map((i) => ({ role: i.kind, text: i.text }));
    completeAndRecord(scenario, turns, evals.current, startedAt.current, completeSession);
    setFinished(true);
  }

  if (finished) return <Summary scenario={scenario} onDone={() => router.push("/dashboard")} evals={evals.current} />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ minHeight: "72vh" }}>
      {/* ヘッダー */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-ink">{scenario.title}</h1>
          <p className="text-xs text-muted">{scenario.goal}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {sttSupported() && (
            <button
              onClick={onSwitchCall}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-core/40 px-2.5 py-1.5 text-xs text-cyan-soft transition hover:bg-cyan-core/10"
              title="ハンズフリー通話に切替"
            >
              <IconPhone width={15} height={15} /> 通話モード
            </button>
          )}
          {ttsSupported() && (
            <button
              onClick={() => setMuted((m) => !m)}
              className={cn(
                "rounded-lg p-2 text-xs transition",
                muted ? "text-muted" : "text-cyan-soft",
              )}
              title="読み上げ切替"
            >
              <IconSpeaker width={16} height={16} />
            </button>
          )}
          <button
            onClick={() => (ended ? finish() : setEnded(true))}
            className="rounded-lg p-2 text-muted transition hover:text-rose-200"
            title="終了する"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>
      </div>

      {/* 使える表現（開始前の型） */}
      {keyPhrases.length > 0 && (
        <details className="mb-3">
          <summary className="cursor-pointer text-xs text-cyan-soft/80">
            この場面で使える表現を見る（{keyPhrases.length}）
          </summary>
          <div className="mt-2 space-y-1.5">
            {keyPhrases.map(
              (p) =>
                p && (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-navy-700/40 px-3 py-1.5"
                  >
                    <div>
                      <div className="text-sm text-cyan-soft">{p.english}</div>
                      <div className="text-[11px] text-muted">{p.japanese}</div>
                    </div>
                    {ttsSupported() && (
                      <button onClick={() => speak(p.english)} className="text-cyan-soft/70">
                        <IconSpeaker width={15} height={15} />
                      </button>
                    )}
                  </div>
                ),
            )}
          </div>
        </details>
      )}

      {/* 会話ログ */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {items.map((it, i) => (
          <ChatItem key={i} item={it} onSaveNatural={saveNatural} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <FiiAvatar state="thinking" size={40} float={false} />
            Fii が聞いてる…
          </div>
        )}
      </div>

      {/* 入力 or 終了 */}
      <div className="mt-3">
        {ended ? (
          <Panel className="flex flex-col items-center gap-3 p-5 text-center">
            <FiiAvatar state="happy" size={80} />
            <p className="text-sm text-ink">ここまで会話を続けられたね。記録して次へ。</p>
            <Button onClick={finish} className="w-full sm:w-auto">
              セッションを記録する <IconCheck width={16} height={16} />
            </Button>
          </Panel>
        ) : (
          <AnswerInput
            onSubmit={onSubmit}
            autoFocusKey={askedCount}
            placeholder="英語で返事（音声OK・完璧じゃなくていい）…"
            submitLabel="返事する"
          />
        )}
      </div>
    </div>
  );
}

function ChatItem({
  item,
  onSaveNatural,
}: {
  item: Item;
  onSaveNatural: (ev: TurnEvaluation) => void;
}) {
  if (item.kind === "fii") {
    return (
      <div className="flex items-start gap-2">
        <FiiAvatar state="idle" size={44} float={false} />
        <div className="max-w-[85%]">
          <FiiCoachBubble english={item.text}>
            <span className="text-cyan-soft">{item.text}</span>
          </FiiCoachBubble>
          {item.jp && <p className="mt-1 pl-1 text-[11px] text-muted">{item.jp}</p>}
        </div>
      </div>
    );
  }
  if (item.kind === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl border border-violet-core/30 bg-violet-core/10 px-4 py-2.5 text-sm text-ink">
          {item.text}
        </div>
      </div>
    );
  }
  return <FeedbackCard ev={item.ev} onSaveNatural={onSaveNatural} />;
}

function FeedbackCard({
  ev,
  onSaveNatural,
}: {
  ev: TurnEvaluation;
  onSaveNatural: (ev: TurnEvaluation) => void;
}) {
  const [saved, setSaved] = useState(false);
  const avg = averageScore(ev.scores);
  return (
    <Panel className="ml-10 border-cyan-core/20 p-3.5 text-sm animate-pop-in">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <IconStar width={14} height={14} className="text-cyan-core" />
        <span className="font-semibold text-cyan-soft">Fii のコーチング</span>
        <span className="ml-auto rounded-full bg-cyan-core/15 px-2 py-0.5 text-[10px] text-cyan-soft">
          {avg}点
        </span>
      </div>
      <ol className="space-y-2">
        <li>
          <span className="text-[11px] text-muted">伝わったこと</span>
          <p className="text-ink">{ev.understood}</p>
        </li>
        <li>
          <span className="text-[11px] text-amber-300/80">いちばんの改善点（1つだけ）</span>
          <p className="text-ink">{ev.topImprovement}</p>
        </li>
        <li>
          <span className="text-[11px] text-cyan-soft/70">より自然な短い英文</span>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="flex-1 rounded-lg bg-navy-700/60 px-2.5 py-1.5 text-cyan-soft">
              {ev.naturalVersion}
            </p>
            {ttsSupported() && (
              <button onClick={() => speak(ev.naturalVersion)} className="text-cyan-soft/70">
                <IconSpeaker width={15} height={15} />
              </button>
            )}
            <button
              onClick={() => {
                onSaveNatural(ev);
                setSaved(true);
              }}
              disabled={saved}
              className="rounded-lg border border-cyan-core/30 px-2 py-1 text-[10px] text-cyan-soft disabled:opacity-40"
            >
              {saved ? "保存済" : "保存"}
            </button>
          </div>
        </li>
        <li>
          <span className="text-[11px] text-muted">次に加える情報</span>
          <p className="text-ink">{ev.nextInfo}</p>
        </li>
      </ol>
    </Panel>
  );
}

// ============================================================
// ハンズフリー通話モード（Web Speech API）
// マイク出しっぱなし → 黙ると自動送信 → Fii音声返答 → マイク自動再開。
// 会話中はコーチングを出さず流し、終了後に Summary でまとめて返す。
// ============================================================

type CallPhase = "connecting" | "fii" | "listening" | "processing" | "ended";

function VoiceCall({
  scenario,
  onSwitchText,
}: {
  scenario: Scenario;
  onSwitchText: () => void;
}) {
  const router = useRouter();
  const completeSession = useLearningStore((s) => s.completeSession);

  const [phase, setPhase] = useState<CallPhase>("connecting");
  const [fiiLine, setFiiLine] = useState<{ text: string; jp?: string }>({
    text: scenario.opening.fii,
    jp: scenario.opening.jp,
  });
  const [liveText, setLiveText] = useState("");
  const [lastUser, setLastUser] = useState("");
  const [finished, setFinished] = useState(false);
  const [turnNo, setTurnNo] = useState(0);

  const askedCount = useRef(0);
  const evals = useRef<TurnEvaluation[]>([]);
  const turns = useRef<SessionTurn[]>([]);
  const startedAt = useRef<number>(Date.now());
  const sttRef = useRef<SttHandle | null>(null);
  const endedRef = useRef(false);
  const advancedRef = useRef(false);
  const gotFinalRef = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supported = sttSupported();

  const clearFallback = () => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = null;
  };

  // マイクを開いてユーザーの発話を待つ
  const goListen = useCallback(() => {
    if (endedRef.current) return;
    clearFallback();
    gotFinalRef.current = false;
    setLiveText("");
    setPhase("listening");
    sttRef.current = startStt({
      onInterim: (t) => setLiveText(t),
      onFinal: (t) => onUserFinal(t),
      onEnd: () => {
        // 無言のまま終わったら、まだ通話中なら再度マイクを開く
        if (!gotFinalRef.current && !endedRef.current) {
          setTimeout(() => {
            if (!endedRef.current && !gotFinalRef.current) goListen();
          }, 300);
        }
      },
      onError: () => {
        if (!endedRef.current && !gotFinalRef.current) setTimeout(goListen, 600);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fii が喋る → 喋り終わったら（or 安全タイマーで）マイクを開く
  const speakFii = useCallback(
    (line: { text: string; jp?: string }) => {
      if (endedRef.current) return;
      clearFallback();
      advancedRef.current = false;
      setFiiLine(line);
      setPhase("fii");
      turns.current.push({ role: "fii", text: line.text });

      const advance = () => {
        if (advancedRef.current || endedRef.current) return;
        advancedRef.current = true;
        goListen();
      };
      const ok = speak(line.text, { onEnd: advance });
      const est = Math.max(1800, line.text.split(/\s+/).length * 380 + 900);
      fallbackTimer.current = setTimeout(advance, ok ? est : 500);
    },
    [goListen],
  );

  function onUserFinal(text: string) {
    if (endedRef.current) return;
    gotFinalRef.current = true;
    sttRef.current?.stop();
    setLastUser(text);
    setLiveText("");
    setPhase("processing");
    turns.current.push({ role: "user", text });
    setTurnNo((n) => n + 1);

    // 評価は裏で記録（通話中は見せない）
    const next = nextClientLine(scenario, askedCount.current);
    evals.current.push(evaluateTurn(text, scenario, next));

    if (next) {
      askedCount.current += 1;
      speakFii({ text: next.fii, jp: next.jp });
    } else {
      endCall();
    }
  }

  // Fii の発話に割り込んで、すぐ自分が話す
  function bargeIn() {
    if (phase !== "fii") return;
    clearFallback();
    advancedRef.current = true;
    stopSpeaking();
    goListen();
  }

  function endCall() {
    if (endedRef.current) return;
    endedRef.current = true;
    clearFallback();
    sttRef.current?.stop();
    stopSpeaking();
    setPhase("ended");
    if (evals.current.length > 0) {
      completeAndRecord(scenario, turns.current, evals.current, startedAt.current, completeSession);
    }
    setFinished(true);
  }

  // 発信: 冒頭の Fii 発話から開始
  useEffect(() => {
    if (!supported) return;
    const t = setTimeout(
      () => speakFii({ text: scenario.opening.fii, jp: scenario.opening.jp }),
      500,
    );
    return () => {
      clearTimeout(t);
      endedRef.current = true;
      clearFallback();
      sttRef.current?.stop();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (finished) {
    return (
      <Summary scenario={scenario} onDone={() => router.push("/dashboard")} evals={evals.current} />
    );
  }

  if (!supported) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <FiiAvatar state="thinking" size={110} />
        <p className="mt-4 text-sm text-muted">
          このブラウザは音声認識に対応していません。<br />
          Chrome / Safari で開くか、テキストモードで続けてね。
        </p>
        <Button className="mt-5" onClick={onSwitchText}>
          <IconText width={16} height={16} /> テキストモードに戻す
        </Button>
      </div>
    );
  }

  const you = phase === "listening";
  const speaking = phase === "fii";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center" style={{ minHeight: "78vh" }}>
      {/* 通話ヘッダー */}
      <div className="mb-2 flex w-full items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-soft">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            通話中 · {scenario.title}
          </div>
          <p className="text-[11px] text-muted">{scenario.goal}</p>
        </div>
        <button
          onClick={onSwitchText}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-muted transition hover:text-cyan-soft"
          title="テキストモードに戻す"
        >
          <IconText width={14} height={14} /> テキスト
        </button>
      </div>

      {/* Fii + 音声リング */}
      <div className="relative mt-6 flex flex-col items-center">
        <VoiceRings active={speaking || you} tone={you ? "violet" : "cyan"} />
        <FiiAvatar state={speaking ? "happy" : you ? "thinking" : "idle"} size={150} />
      </div>

      {/* 状態ラベル */}
      <div className="mt-6 text-center">
        <div
          className={cn(
            "text-sm font-semibold",
            speaking ? "text-cyan-soft" : you ? "text-violet-soft" : "text-muted",
          )}
        >
          {phase === "connecting" && "接続中…"}
          {speaking && "Fii が話しています"}
          {you && "あなたの番 — 話して"}
          {phase === "processing" && "聞き取り中…"}
        </div>
      </div>

      {/* Fii の発話 */}
      {fiiLine && (
        <div className="mt-4 w-full">
          <div
            onClick={bargeIn}
            className={cn(
              "rounded-2xl border px-4 py-3 text-center text-sm transition",
              speaking ? "border-cyan-core/40 bg-cyan-core/5" : "border-white/10 bg-navy-700/40",
            )}
          >
            <p className="text-cyan-soft">{fiiLine.text}</p>
            {fiiLine.jp && <p className="mt-1 text-[11px] text-muted">{fiiLine.jp}</p>}
            {speaking && (
              <p className="mt-2 text-[10px] text-muted/70">タップで割り込んで話せる</p>
            )}
          </div>
        </div>
      )}

      {/* 自分の発話（ライブ字幕） */}
      <div className="mt-3 min-h-[52px] w-full">
        {(liveText || lastUser) && (
          <div className="rounded-2xl border border-violet-core/30 bg-violet-core/10 px-4 py-2.5 text-right text-sm text-ink">
            {liveText || lastUser}
            {you && liveText && <span className="ml-0.5 animate-pulse">▍</span>}
          </div>
        )}
        {you && !liveText && (
          <p className="text-center text-xs text-muted/60">…マイクは開いてる。短くていいから声に出して。</p>
        )}
      </div>

      <div className="flex-1" />

      {/* 通話コントロール */}
      <div className="mb-2 flex w-full items-center justify-center gap-4 py-4">
        <div className="text-center text-[11px] text-muted">
          <div className="font-mono text-base text-cyan-soft">{turnNo}</div>
          ターン
        </div>
        <button
          onClick={endCall}
          className="flex items-center gap-2 rounded-full bg-rose-500/90 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-500"
        >
          <IconPhoneOff width={18} height={18} /> 通話を終える
        </button>
        {speaking && (
          <button
            onClick={bargeIn}
            className="flex items-center gap-1.5 rounded-full border border-violet-core/40 px-4 py-3 text-xs text-violet-soft transition hover:bg-violet-core/10"
          >
            <IconMic width={16} height={16} /> 今話す
          </button>
        )}
      </div>
      <p className="mb-2 text-center text-[10px] text-muted/50">
        コーチングは通話が終わってからまとめて返すよ。今は止まらず話すことだけに集中して。
      </p>
    </div>
  );
}

function VoiceRings({ active, tone }: { active: boolean; tone: "cyan" | "violet" }) {
  const color = tone === "violet" ? "rgba(160,107,255,0.5)" : "rgba(69,205,255,0.55)";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("absolute rounded-full", active && "animate-ping")}
          style={{
            width: 150 + i * 46,
            height: 150 + i * 46,
            border: `1px solid ${color}`,
            opacity: active ? 0.5 - i * 0.14 : 0.12,
            animationDuration: `${2 + i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function Summary({
  scenario,
  evals,
  onDone,
}: {
  scenario: Scenario;
  evals: TurnEvaluation[];
  onDone: () => void;
}) {
  const clearFlash = useLearningStore((s) => s.clearFlash);
  // 完了時のフラッシュはマウント時に一度スナップショットして固定する
  // （StrictMode の二重マウントで消えないよう、クリアは「ダッシュボードへ」押下時のみ）
  const [flash] = useState(() => useLearningStore.getState().lastFlash);

  const axisAvg: Partial<Record<EvaluationAxis, number>> = {};
  const totals: Partial<Record<EvaluationAxis, number[]>> = {};
  for (const ev of evals) {
    (Object.keys(ev.scores) as EvaluationAxis[]).forEach((ax) => {
      const v = ev.scores[ax];
      if (typeof v === "number") (totals[ax] ??= []).push(v);
    });
  }
  (Object.keys(totals) as EvaluationAxis[]).forEach((ax) => {
    const arr = totals[ax]!;
    axisAvg[ax] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  });
  const shown = (Object.keys(axisAvg) as EvaluationAxis[]).slice(0, 6);

  // 通話後のふりかえり: 詰まった順に並べ、改善点1つ＋言い直し表現を抽出
  const byWeak = [...evals].sort((a, b) => averageScore(a.scores) - averageScore(b.scores));
  const topImprovement = byWeak[0]?.topImprovement;
  const seen = new Set<string>();
  const stuck = byWeak
    .filter((ev) => averageScore(ev.scores) < 78)
    .map((ev) => ev.naturalVersion)
    .filter((s) => {
      const k = s.trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-lg px-2 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <FiiAvatar state="master" size={120} />
        <h1 className="text-lg font-bold text-ink glow-text">セッション完了</h1>
        <p className="text-sm text-muted">{scenario.title}</p>
      </div>

      {flash && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <FlashTile label="獲得XP" value={`+${flash.xp}`} on />
          <FlashTile label="ストリーク" value={flash.streakUp ? "+1" : "維持"} on={flash.streakUp} />
          <FlashTile label="レベル" value={flash.leveledUp ? "UP!" : "—"} on={flash.leveledUp} />
        </div>
      )}
      {flash?.goalReached && (
        <FiiCoachBubble className="mt-3">今日のノルマ達成。ちゃんとやったね。合格。</FiiCoachBubble>
      )}

      {/* 今日のふりかえり（通話中は出さず、ここでまとめて返す） */}
      {evals.length > 0 && (
        <Panel className="mt-4 p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">今日のふりかえり</h3>
          {topImprovement && (
            <div className="mb-3 rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2">
              <div className="text-[11px] text-amber-300/80">いちばんの改善点（1つだけ）</div>
              <p className="text-sm text-ink">{topImprovement}</p>
            </div>
          )}
          {stuck.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] text-cyan-soft/70">
                詰まった所の自然な言い直し（復習に保存済み）
              </div>
              <ul className="space-y-1.5">
                {stuck.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-navy-700/50 px-3 py-1.5"
                  >
                    <span className="text-sm text-cyan-soft">{s}</span>
                    {ttsSupported() && (
                      <button onClick={() => speak(s)} className="shrink-0 text-cyan-soft/70">
                        <IconSpeaker width={14} height={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!topImprovement && stuck.length === 0 && (
            <p className="text-sm text-muted">大きな詰まりなし。いい流れだった。</p>
          )}
        </Panel>
      )}

      <Panel className="mt-4 p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">今回の能力別スコア</h3>
        <div className="space-y-2">
          {shown.map((ax) => (
            <div key={ax} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted">{AXIS_LABEL[ax]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-cyan-core/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-core to-violet-core"
                  style={{ width: `${axisAvg[ax] ?? 0}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-cyan-soft">{axisAvg[ax] ?? 0}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Button
        className="mt-6 w-full"
        onClick={() => {
          clearFlash();
          onDone();
        }}
      >
        ダッシュボードへ <IconArrowRight width={18} height={18} />
      </Button>
    </div>
  );
}

function FlashTile({ label, value, on }: { label: string; value: string; on?: boolean }) {
  return (
    <Panel className={cn("py-3", on && "border-cyan-core/50 shadow-glow")}>
      <div className={cn("text-lg font-bold", on ? "text-cyan-soft glow-text" : "text-muted")}>
        {value}
      </div>
      <div className="text-[10px] text-muted">{label}</div>
    </Panel>
  );
}
