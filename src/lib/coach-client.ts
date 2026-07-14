"use client";

import type { Scenario, TurnEvaluation, AppMode, ScenarioSeedQuestion } from "@/types";
import { evaluateTurn, nextClientLine } from "@/lib/mock-coach";

export interface CoachTurnResult {
  evaluation: TurnEvaluation;
  nextLine?: ScenarioSeedQuestion;
  usedAi: boolean;
}

/**
 * 1ターン処理。mock は即ローカル評価、ai は /api/evaluate を叩き、
 * 失敗時は自動で mock へフォールバックする（会話を止めない）。
 */
export async function runCoachTurn(params: {
  mode: AppMode;
  scenario: Scenario;
  userText: string;
  askedCount: number; // これまでに出したクライアント質問数
  ms?: number;
  history: { role: "fii" | "user"; text: string }[];
}): Promise<CoachTurnResult> {
  const { mode, scenario, userText, askedCount, ms } = params;

  if (mode === "ai") {
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          evaluation: TurnEvaluation;
          nextLine?: ScenarioSeedQuestion;
        };
        if (data.evaluation) {
          return { evaluation: data.evaluation, nextLine: data.nextLine, usedAi: true };
        }
      }
    } catch {
      // フォールバック
    }
  }

  const next = nextClientLine(scenario, askedCount);
  const evaluation = evaluateTurn(userText, scenario, next, ms);
  return { evaluation, nextLine: next, usedAi: false };
}
