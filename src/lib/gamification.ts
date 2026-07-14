import type { Gamification, DailyLoad } from "@/types";
import { todayISO, diffDays } from "@/lib/date";

// ============================================================
// Duolingo 由来のゲーミフィケーション: XP / レベル / ストリーク /
// デイリーゴール。数値は「毎日続く」ことを最優先に軽めに設計。
// ============================================================

/** レベルn到達に必要な累計XP。ゆるい二次カーブ。 */
export function xpForLevel(level: number): number {
  return Math.round(40 * (level - 1) + 12 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp: number): number {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

/** 現在レベル内の進捗(0-1)。 */
export function levelProgress(xp: number): {
  level: number;
  into: number;
  span: number;
  ratio: number;
} {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - base);
  const into = xp - base;
  return { level, into, span, ratio: Math.min(1, into / span) };
}

export const dailyGoalByLoad: Record<DailyLoad, number> = {
  light: 10,
  standard: 15,
  focus: 25,
};

/** 1セッションのXP: 継続維持を主目的に、質で上乗せ。 */
export function sessionXp(avgScore: number, turns: number): number {
  const base = 15;
  const quality = Math.round((avgScore / 100) * 15);
  const effort = Math.min(20, turns * 2);
  return base + quality + effort;
}

interface AccrueResult {
  next: Gamification;
  streakUp: boolean;
  goalReached: boolean;
  leveledUp: boolean;
}

/**
 * 学習の成果をゲーミフィケーション状態へ反映する（純関数）。
 * - ストリーク: 昨日学習していれば+1、今日初回でなければ据置、2日以上空けばフリーズ消費 or リセット
 * - デイリーゴール: 当日分数を積み上げ、閾値到達を通知
 */
export function accrue(
  g: Gamification,
  addMinutes: number,
  addXp: number,
  masteredPhrases: number,
): AccrueResult {
  const today = todayISO();
  let next: Gamification = { ...g };

  // 日付が変わっていたら当日分数をリセット
  if (next.todayDate !== today) {
    next.todayDate = today;
    next.todayMinutes = 0;
  }

  const prevLevel = levelFromXp(next.xp);

  // ストリーク判定
  let streakUp = false;
  if (next.lastStudyDate === "") {
    next.streakDays = 1;
    streakUp = true;
  } else {
    const gap = diffDays(today, next.lastStudyDate);
    if (gap === 0) {
      // 今日すでに学習済み → 据置
    } else if (gap === 1) {
      next.streakDays += 1;
      streakUp = true;
    } else if (gap === 2 && next.freezes > 0) {
      // 1日空けたがフリーズで救済（連続は維持）
      next.freezes -= 1;
      next.streakDays += 1;
      streakUp = true;
    } else {
      next.streakDays = 1; // リセット
    }
  }
  next.lastStudyDate = today;

  const beforeMinutes = next.todayMinutes;
  next.todayMinutes = beforeMinutes + addMinutes;
  next.xp = next.xp + addXp;
  next.level = levelFromXp(next.xp);
  next.masteredPhrases = masteredPhrases;

  const goalReached =
    beforeMinutes < next.dailyGoalMinutes &&
    next.todayMinutes >= next.dailyGoalMinutes;

  return {
    next,
    streakUp,
    goalReached,
    leveledUp: next.level > prevLevel,
  };
}
