import type {
  Scenario,
  TurnEvaluation,
  EvaluationAxis,
  ScenarioSeedQuestion,
} from "@/types";
import { scoreAnswer, averageScore, countWords } from "@/lib/scoring";

// ============================================================
// mock モードの Fii コーチ。APIキー無しで動く。
// フィードバック順序は仕様どおり固定:
//   1 何が伝わったか → 2 改善点1つ → 3 自然な短い英文
//   → 4 次に加える情報 → 5 続けて答える質問
// ============================================================

const AXIS_ADVICE: Record<EvaluationAxis, string> = {
  meaning_clarity: "1文をもっと短くすると要点が伝わりやすくなる",
  grammar: "主語と動詞をはっきりさせるとぐっと安定する",
  naturalness: "つなぎ言葉(um, like)を減らすと自然に聞こえる",
  response_speed: "完璧を待たず、まず短い一言で口火を切ろう",
  conversation_continuity: "分からない時は 'You mean ...?' で確認して会話を続けよう",
  business_appropriateness: "'Could you...' 'I'd be happy to...' で丁寧さを足そう",
  questioning_skill: "最後に相手へ質問を返すと会話が続く",
  negotiation_skill: "条件は 'I can do X, but it affects Y' の型で伝えよう",
  explanation_skill: "'The main goal is ...' から始めると説明が締まる",
  pronunciation: "語尾までしっかり発音すると聞き取ってもらえる",
};

/** 最も低い軸を1つ選んで改善アドバイスにする。 */
function pickImprovement(
  scores: Partial<Record<EvaluationAxis, number>>,
): { axis: EvaluationAxis; advice: string } {
  let worst: EvaluationAxis = "conversation_continuity";
  let min = 101;
  (Object.keys(scores) as EvaluationAxis[]).forEach((axis) => {
    const v = scores[axis];
    if (typeof v === "number" && v < min) {
      min = v;
      worst = axis;
    }
  });
  return { axis: worst, advice: AXIS_ADVICE[worst] };
}

/** 長い回答を短い自然文に言い直す（超簡易ヒューリスティック）。 */
function toNaturalShort(text: string): string {
  const first = text.split(/[.!?]/)[0]?.trim() ?? text.trim();
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length <= 14) return capitalize(ensurePeriod(first));
  return capitalize(ensurePeriod(words.slice(0, 14).join(" ")));
}

export function evaluateTurn(
  userText: string,
  scenario: Scenario,
  nextQuestion: ScenarioSeedQuestion | undefined,
  ms?: number,
): TurnEvaluation {
  const scores = scoreAnswer({ text: userText, ms });
  const { advice } = pickImprovement(scores);
  const avg = averageScore(scores);
  const words = countWords(userText);

  const understood =
    words === 0
      ? "まだ何も聞こえないよ。まず一言でいいから返してみて。"
      : avg >= 75
        ? "要点はしっかり伝わった。特に言いたいことが明確だった。"
        : avg >= 55
          ? "言いたいことの中心は伝わったよ。"
          : "伝えようとしている方向は分かった。";

  return {
    scores,
    understood,
    topImprovement: advice,
    naturalVersion: toNaturalShort(userText || "The main goal is to build trust."),
    nextInfo: nextInfoFor(scenario),
    followUpQuestion:
      nextQuestion?.fii ?? "Anything else you'd like me to know before we start?",
  };
}

function nextInfoFor(scenario: Scenario): string {
  switch (scenario.category) {
    case "portfolio":
      return "その動画で「どんな成果が出たか」を一言足そう。";
    case "planning":
      return "なぜその企画が視聴者に効くのか、理由を1つ添えよう。";
    case "negotiation":
      return "こちらの条件と、その代わりに何ができるかをセットで言おう。";
    case "revision":
      return "「どこを・どう」変えるのか具体を1点確認しよう。";
    default:
      return "相手の目的（ゴール）を確認する一言を足そう。";
  }
}

/** Fii の口火（クライアント役の第一声）。 */
export function openingLine(scenario: Scenario): ScenarioSeedQuestion {
  return scenario.opening;
}

/** 次に出すクライアント発話を選ぶ（順番に消化）。 */
export function nextClientLine(
  scenario: Scenario,
  askedCount: number,
): ScenarioSeedQuestion | undefined {
  return scenario.questions[askedCount];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function ensurePeriod(s: string): string {
  return /[.?!]$/.test(s) ? s : s + ".";
}
