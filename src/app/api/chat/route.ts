import { NextResponse } from "next/server";
import { aiEnabled, chat } from "@/lib/openai";

export const runtime = "nodejs";

interface Body {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  clientRole?: string;
}

/**
 * Fii（クライアント役）の自由会話応答。AIモード専用。
 * 鍵が無い場合は 200 で mock 応答を返す。
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!aiEnabled()) {
    return NextResponse.json({
      reply: "That sounds good. Can you tell me a bit more?",
      usedAi: false,
    });
  }

  try {
    const sys = [
      "You are Fii, role-playing as an overseas client talking to a Japanese video director.",
      body.clientRole ? `Client role: ${body.clientRole}.` : "",
      "Speak natural, simple business English. Keep replies to 1-2 short sentences.",
      "Stay in character as the client; do not coach here.",
    ]
      .filter(Boolean)
      .join(" ");

    const reply = await chat(
      [{ role: "system", content: sys }, ...body.messages],
      { temperature: 0.7 },
    );
    return NextResponse.json({ reply, usedAi: true });
  } catch (err) {
    console.warn("[/api/chat] fallback:", err);
    return NextResponse.json({
      reply: "Okay, got it. What would you suggest?",
      usedAi: false,
    });
  }
}
