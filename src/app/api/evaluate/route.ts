import { NextResponse } from "next/server";
import { aiEnabled, chat } from "@/lib/openai";
import { evaluateTurn, nextClientLine } from "@/lib/mock-coach";
import { sendToLab } from "@/lib/lab";
import type { Scenario, TurnEvaluation, ScenarioSeedQuestion } from "@/types";

export const runtime = "nodejs";

interface Body {
  scenario: Scenario;
  userText: string;
  askedCount: number;
  ms?: number;
  history?: { role: "fii" | "user"; text: string }[];
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { scenario, userText, askedCount, ms } = body;
  const fallbackNext = nextClientLine(scenario, askedCount);

  // 鍵が無ければ mock 評価をそのまま返す（フロントと同じロジック）
  if (!aiEnabled()) {
    return NextResponse.json({
      evaluation: evaluateTurn(userText, scenario, fallbackNext, ms),
      nextLine: fallbackNext,
      usedAi: false,
    });
  }

  try {
    const sys = [
      "You are Fii, an English coach for a Japanese video director working with overseas clients.",
      "Persona: friendly, a little cheeky, but serious about the learner's growth. Never over-praise.",
      "Give feedback in this exact order and keep each field SHORT:",
      "1) understood (JP): what was communicated.",
      "2) topImprovement (JP): the SINGLE most important improvement, only one.",
      "3) naturalVersion (EN): a shorter, natural version of what they tried to say.",
      "4) nextInfo (JP): one piece of info to add next.",
      "5) followUpQuestion (EN): your next line as the client to keep the roleplay going.",
      "Also return scores 0-100 for: meaning_clarity, grammar, naturalness, response_speed, conversation_continuity, business_appropriateness, explanation_skill, questioning_skill.",
      "Priorities: short sentences, keep the conversation going, real business usefulness.",
      "Return ONLY a JSON object with keys: understood, topImprovement, naturalVersion, nextInfo, followUpQuestion, scores.",
    ].join("\n");

    const user = [
      `Scenario: ${scenario.title} (${scenario.titleEn}). Client role: ${scenario.clientRole}. Goal: ${scenario.goal}.`,
      `The client's last line was: "${history_last(body)}"`,
      `The learner replied: "${userText}"`,
      fallbackNext
        ? `Suggested next client line (you may improve it): "${fallbackNext.fii}"`
        : "This is near the end of the roleplay.",
    ].join("\n");

    const raw = await chat(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.5 },
    );

    const parsed = JSON.parse(raw) as Partial<TurnEvaluation> & {
      scores?: TurnEvaluation["scores"];
    };

    const evaluation: TurnEvaluation = {
      scores: parsed.scores ?? evaluateTurn(userText, scenario, fallbackNext, ms).scores,
      understood: parsed.understood ?? "伝わったよ。",
      topImprovement: parsed.topImprovement ?? "もう少し短くしよう。",
      naturalVersion: parsed.naturalVersion ?? userText,
      nextInfo: parsed.nextInfo ?? "相手の目的を確認しよう。",
      followUpQuestion: parsed.followUpQuestion ?? fallbackNext?.fii ?? "Anything else?",
    };

    const nextLine: ScenarioSeedQuestion | undefined = fallbackNext
      ? { fii: evaluation.followUpQuestion, jp: fallbackNext.jp }
      : undefined;

    // LAB へ学習イベントを流す（設定時のみ）
    void sendToLab({
      kind: "session_completed",
      summary: `turn on ${scenario.id}`,
      payload: { scores: evaluation.scores, userText },
      at: new Date().toISOString(),
    });

    return NextResponse.json({ evaluation, nextLine, usedAi: true });
  } catch (err) {
    // 失敗しても会話を止めない: mock にフォールバック
    console.warn("[/api/evaluate] fallback:", err);
    return NextResponse.json({
      evaluation: evaluateTurn(userText, scenario, fallbackNext, ms),
      nextLine: fallbackNext,
      usedAi: false,
    });
  }
}

function history_last(body: Body): string {
  const fiiLines = (body.history ?? []).filter((h) => h.role === "fii");
  return fiiLines[fiiLines.length - 1]?.text ?? body.scenario.opening.fii;
}
