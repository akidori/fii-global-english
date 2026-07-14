// ============================================================
// LAB（flip-lab / 第二の脳）連携 seam。
//
// AK の指示: 「学習の進展とパーソナライズの参考に LAB を使用」。
// MVP は LocalStorage 完結で動くが、AI モードではここを通して
// 学習ログを LAB に流し、過去の傾向を引き戻す設計にしておく。
//
// 実接続は Claude Code / MCP 側の `send_to_lab` / `recall_from_lab`
// が担うため、アプリからは HTTP エンドポイント越しに呼ぶ想定。
// ここでは環境変数が無ければ安全に no-op する。
// ============================================================

const LAB_ENDPOINT = process.env.LAB_ENDPOINT; // 例: http://localhost:xxxx/lab
const LAB_TOKEN = process.env.LAB_TOKEN;

export function labEnabled(): boolean {
  return !!LAB_ENDPOINT;
}

export interface LabLearningEvent {
  kind: "session_completed" | "level_assessed" | "plan_generated";
  summary: string;
  payload: Record<string, unknown>;
  at: string;
}

/** 学習イベントを LAB に送る（失敗しても学習を止めない）。 */
export async function sendToLab(event: LabLearningEvent): Promise<boolean> {
  if (!LAB_ENDPOINT) return false;
  try {
    const res = await fetch(`${LAB_ENDPOINT}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LAB_TOKEN ? { Authorization: `Bearer ${LAB_TOKEN}` } : {}),
      },
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch (err) {
    console.warn("[lab] sendToLab failed:", err);
    return false;
  }
}

/** LAB から学習者の傾向メモを引く（パーソナライズ補強用）。 */
export async function recallFromLab(query: string): Promise<string | null> {
  if (!LAB_ENDPOINT) return null;
  try {
    const res = await fetch(
      `${LAB_ENDPOINT}/recall?q=${encodeURIComponent(query)}`,
      { headers: LAB_TOKEN ? { Authorization: `Bearer ${LAB_TOKEN}` } : {} },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text ?? null;
  } catch {
    return null;
  }
}
