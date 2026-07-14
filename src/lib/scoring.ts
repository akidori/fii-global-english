import type {
  EvaluationAxis,
  AssessmentDimension,
  CEFR,
  WorkLevel,
  Assessment,
  AssessmentAnswer,
} from "@/types";

// ============================================================
// スコアリング（mock モードの評価エンジン）
// 実務英語の芯: 「短く・明快に・会話を止めない」を数値化する。
// AI モードでは /api/evaluate が LLM 採点で上書きする。
// ============================================================

const KEEP_GOING = [
  "let me",
  "could you",
  "you mean",
  "in other words",
  "for example",
  "the main",
  "so basically",
  "what i mean",
  "sorry",
  "one moment",
];

const FILLERS = ["um", "uh", "like", "you know", "basically", "actually"];

export function countSentences(text: string): number {
  const s = text.split(/[.!?]+/).map((t) => t.trim()).filter(Boolean);
  return Math.max(1, s.length);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface HeuristicInput {
  text: string;
  ms?: number; // 回答までの所要時間
}

/** 回答テキストから各評価軸を推定（0-100）。 */
export function scoreAnswer(input: HeuristicInput): Partial<Record<EvaluationAxis, number>> {
  const text = input.text.trim();
  if (!text) {
    return { meaning_clarity: 0, conversation_continuity: 0 };
  }
  const words = countWords(text);
  const sentences = countSentences(text);
  const wordsPerSentence = words / sentences;
  const lower = text.toLowerCase();

  // 明快さ: 1文が短いほど良い（15語前後が理想、30超で減点）
  const clarity = clamp(100 - Math.max(0, wordsPerSentence - 15) * 4);

  // 自然さ: フィラー過多を減点
  const fillerHits = FILLERS.reduce(
    (n, f) => n + (lower.split(f).length - 1),
    0,
  );
  const naturalness = clamp(90 - fillerHits * 8 + (words >= 4 ? 6 : -20));

  // 会話継続: 繋ぎ/確認表現があると加点
  const keepGoing = KEEP_GOING.some((k) => lower.includes(k));
  const continuity = clamp((keepGoing ? 78 : 60) + (words >= 6 ? 10 : 0));

  // 応答速度: ms があれば評価（12秒以内で満点、30秒で0付近）
  const speed =
    input.ms == null
      ? 70
      : clamp(100 - Math.max(0, input.ms / 1000 - 12) * 4);

  // 文法(粗い): 語数と大文字始まりなど最低限のシグナル
  const grammar = clamp(
    62 +
      (/^[A-Z]/.test(text) ? 8 : -6) +
      (words >= 4 ? 10 : -10) +
      (/[.?!]$/.test(text) ? 6 : 0),
  );

  // 説明力: 具体語(because, goal, target, so that...)で加点
  const explanatory = [
    "because",
    "goal",
    "target",
    "so that",
    "the point",
    "in order to",
    "the main",
  ].some((k) => lower.includes(k));
  const explanation = clamp((explanatory ? 80 : 60) + (sentences <= 3 ? 6 : -6));

  // 質問力
  const asks = text.includes("?");
  const questioning = clamp(asks ? 82 : 55);

  // ビジネス適切さ: 丁寧表現
  const polite = ["could", "would", "may i", "thank", "appreciate", "happy to"].some(
    (k) => lower.includes(k),
  );
  const business = clamp(polite ? 82 : 66);

  return {
    meaning_clarity: clarity,
    grammar,
    naturalness,
    response_speed: speed,
    conversation_continuity: continuity,
    business_appropriateness: business,
    explanation_skill: explanation,
    questioning_skill: questioning,
  };
}

export function averageScore(
  scores: Partial<Record<EvaluationAxis, number>>,
): number {
  const vals = Object.values(scores).filter((v): v is number => typeof v === "number");
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.round(Math.max(lo, Math.min(hi, n)));
}

// ---- 診断スコア → レベル判定 -----------------------------

/** 自己回答型の診断結果から CEFR / WorkLevel を推定する。 */
export function estimateLevel(scores: Partial<Record<AssessmentDimension, number>>): {
  level: CEFR;
  workLevel: WorkLevel;
} {
  const vals = Object.values(scores).filter((v): v is number => typeof v === "number");
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 30;

  let level: CEFR = "A1";
  if (avg >= 82) level = "C1";
  else if (avg >= 68) level = "B2";
  else if (avg >= 50) level = "B1";
  else if (avg >= 32) level = "A2";

  const workLevel = ((): WorkLevel => {
    if (avg >= 85) return 6;
    if (avg >= 70) return 5;
    if (avg >= 55) return 4;
    if (avg >= 40) return 3;
    if (avg >= 25) return 2;
    return 1;
  })();

  return { level, workLevel };
}

/** 診断の回答配列から各次元スコアを集計する。 */
export function aggregateAssessment(answers: AssessmentAnswer[]): Assessment["scores"] {
  const scores: Assessment["scores"] = {};
  // 診断問題側で dimension を questionId プレフィックスに埋め込む（例: "speaking:intro"）
  const buckets: Partial<Record<AssessmentDimension, number[]>> = {};
  for (const a of answers) {
    const dim = a.questionId.split(":")[0] as AssessmentDimension;
    const v = a.selfRatedScore ?? textScoreFallback(a.value);
    (buckets[dim] ??= []).push(v);
  }
  (Object.keys(buckets) as AssessmentDimension[]).forEach((dim) => {
    const arr = buckets[dim]!;
    scores[dim] = Math.round(arr.reduce((x, y) => x + y, 0) / arr.length);
  });
  return scores;
}

function textScoreFallback(text: string): number {
  const words = countWords(text);
  if (words === 0) return 15;
  return clamp(35 + words * 2);
}
