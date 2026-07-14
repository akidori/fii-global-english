import type { Phrase, PhraseSource, PhraseCategory } from "@/types";
import { todayISO, addDaysISO, isDue } from "@/lib/date";
import { uid } from "@/lib/id";

// ============================================================
// 間隔反復（当日→翌日→3日→7日→14日→30日）
// mastery 段階でインターバルを引く。
// ============================================================

export const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30] as const;

export function nextReviewDate(mastery: number, from = todayISO()): string {
  const idx = Math.min(mastery, REVIEW_INTERVALS.length - 1);
  return addDaysISO(from, REVIEW_INTERVALS[idx] ?? 30);
}

export function makePhrase(input: {
  english: string;
  japanese: string;
  category: PhraseCategory;
  source: PhraseSource;
}): Phrase {
  return {
    id: uid("ph"),
    english: input.english,
    japanese: input.japanese,
    category: input.category,
    source: input.source,
    mastery: 0,
    reviewDate: todayISO(),
    mistakeCount: input.source === "mistake" || input.source === "repeated_mistake" ? 1 : 0,
    createdAt: todayISO(),
  };
}

/** 正解 → mastery を1つ進め、次回を先送り。 */
export function gradeCorrect(p: Phrase): Phrase {
  const mastery = Math.min(5, p.mastery + 1);
  return {
    ...p,
    mastery,
    reviewDate: nextReviewDate(mastery),
    lastReviewedAt: todayISO(),
  };
}

/** 不正解 → mastery を下げ、翌日にすぐ再出題。 */
export function gradeWrong(p: Phrase): Phrase {
  const mastery = Math.max(0, p.mastery - 1);
  return {
    ...p,
    mastery,
    mistakeCount: p.mistakeCount + 1,
    reviewDate: addDaysISO(todayISO(), 1),
    lastReviewedAt: todayISO(),
  };
}

export function duePhrases(phrases: Phrase[], today = todayISO()): Phrase[] {
  return phrases
    .filter((p) => isDue(p.reviewDate, today))
    .sort((a, b) => a.reviewDate.localeCompare(b.reviewDate));
}

export function masteredCount(phrases: Phrase[]): number {
  return phrases.filter((p) => p.mastery >= 4).length;
}

/** 同一英文の重複登録を避ける（大文字小文字/前後空白を無視）。 */
export function normalizeKey(english: string): string {
  return english.trim().toLowerCase().replace(/\s+/g, " ");
}
