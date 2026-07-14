import { NextResponse } from "next/server";
import { aiEnabled, chat } from "@/lib/openai";
import { generatePlan } from "@/lib/plan-generator";
import { sendToLab } from "@/lib/lab";
import type { UserProfile, Assessment } from "@/types";

export const runtime = "nodejs";

interface Body {
  profile: UserProfile;
  assessment: Assessment;
}

/**
 * 学習プランを（サーバで）生成し、AIモードならコーチのひと言を添える。
 * プラン本体は決定的ロジック（鍵不要）で作るため、常に成功する。
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const plan = generatePlan(body.profile, body.assessment);

  let note = "現在地から目標まで、毎週1場面ずつ潰していこう。止まらないことが最優先。";
  if (aiEnabled()) {
    try {
      note = await chat(
        [
          {
            role: "system",
            content:
              "You are Fii, a cheeky but caring English coach. Reply in Japanese, 1-2 short sentences, motivating a Japanese video director toward working with overseas clients.",
          },
          {
            role: "user",
            content: `Level ${body.assessment.level}, target scene ${body.profile.priorityScene}, weakness ${body.profile.weakness}. Give one short push.`,
          },
        ],
        { temperature: 0.8 },
      );
    } catch {
      // 既定のnoteを使う
    }
  }

  void sendToLab({
    kind: "plan_generated",
    summary: `plan for ${body.profile.priorityScene}`,
    payload: { level: body.assessment.level, target: plan.targetLevel },
    at: new Date().toISOString(),
  });

  return NextResponse.json({ plan, note });
}
