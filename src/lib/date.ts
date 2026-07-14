/** 日付ユーティリティ（ローカルタイム基準・ISO date "YYYY-MM-DD"）。 */

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function diffDays(aIso: string, bIso: string): number {
  const a = new Date(aIso + "T00:00:00").getTime();
  const b = new Date(bIso + "T00:00:00").getTime();
  return Math.round((a - b) / 86_400_000);
}

/** iso が today 以前（＝復習期限が来ている）か。 */
export function isDue(iso: string, today: string = todayISO()): boolean {
  return diffDays(iso, today) <= 0;
}

const WD = ["日", "月", "火", "水", "木", "金", "土"];
export function jpWeekday(iso: string): string {
  return WD[new Date(iso + "T00:00:00").getDay()] ?? "";
}
