import { NextResponse } from "next/server";
import { aiEnabled, tts } from "@/lib/openai";

export const runtime = "nodejs";

/**
 * サーバーTTS（OpenAI）。Web Speech API が使えない環境向けの選択肢。
 * 鍵が無ければ 501 を返し、クライアントは Web Speech にフォールバックする。
 */
export async function POST(req: Request) {
  if (!aiEnabled()) {
    return NextResponse.json({ error: "tts not configured" }, { status: 501 });
  }
  let text = "";
  try {
    ({ text } = (await req.json()) as { text: string });
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!text.trim()) return NextResponse.json({ error: "empty text" }, { status: 400 });

  try {
    const audio = await tts(text.slice(0, 500));
    return new NextResponse(audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.warn("[/api/speech] failed:", err);
    return NextResponse.json({ error: "tts failed" }, { status: 502 });
  }
}
