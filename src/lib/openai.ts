// ============================================================
// サーバー専用: OpenAI 呼び出し。API Route からのみ import する。
// APIキーはここ（サーバ側の環境変数）でしか読まない。
// （このファイルは API Route からのみ import すること）
// ============================================================

export function aiEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Chat Completions を叩く。JSON モード対応。失敗時は例外。 */
export async function chat(
  messages: ChatMessage[],
  opts?: { json?: boolean; temperature?: number },
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts?.temperature ?? 0.6,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message.content ?? "";
}

/** 音声合成(TTS)。mp3 の ArrayBuffer を返す。失敗時は例外。 */
export async function tts(text: string): Promise<ArrayBuffer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "alloy",
      input: text,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
  return res.arrayBuffer();
}
