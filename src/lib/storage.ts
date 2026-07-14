import type { AppState } from "@/types";
import { STORAGE_KEY, STATE_VERSION, defaultState } from "@/lib/defaults";

// ============================================================
// LocalStorage 永続層（アプリ内で localStorage を触るのはここだけ）
// SSR 安全: window 不在なら既定状態を返す / 保存は no-op。
// 後で Supabase に差し替える場合もこの4関数の実装だけ置換する。
// ============================================================

function hasWindow(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** 読み込み。壊れていたら既定へフォールバックする。 */
export function loadState(): AppState {
  if (!hasWindow()) return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // 浅いマイグレーション: 既定に上書きして欠損キーを補う。
    return migrate({ ...defaultState(), ...parsed });
  } catch (err) {
    console.warn("[storage] load failed, using defaults:", err);
    return defaultState();
  }
}

/** 保存。失敗しても例外を投げない（学習を止めない）。 */
export function saveState(state: AppState): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[storage] save failed:", err);
  }
}

export function clearState(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[storage] clear failed:", err);
  }
}

/** 将来のスキーマ変更用フック。 */
function migrate(state: AppState): AppState {
  if (state.version !== STATE_VERSION) {
    return { ...state, version: STATE_VERSION };
  }
  return state;
}
