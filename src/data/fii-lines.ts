// ============================================================
// Fii のセリフ集。人格: 生意気だが成長には真剣なツンデレコーチ。
// 過剰に褒めない / 文法説教しない / 改善は1つだけ。
// ============================================================

export type FiiState =
  | "idle"
  | "happy"
  | "thinking"
  | "sleepy"
  | "master"
  | "effect";

export const FII_GREETINGS: string[] = [
  "来たね。今日もサボらせないから。",
  "よし、10分でいい。始めるよ。",
  "英語、逃げてても案件は来ないよ？やろ。",
  "今日の分、さっさと終わらせて可処分時間に回そ。",
];

export const FII_STREAK: string[] = [
  "続いてるじゃん。……別に見直してないけど。",
  "連続記録更新。まあ、悪くない。",
  "毎日やる人が結局いちばん伸びる。知ってた？",
];

export const FII_GOAL_REACHED: string[] = [
  "今日のノルマ達成。合格。",
  "はい、今日のぶん終わり。ちゃんとやったね。",
];

export const FII_LEVEL_UP: string[] = [
  "レベル上がった。まだ通過点だけどね。",
  "お、伸びた。この調子で海外案件まで持っていくよ。",
];

export const FII_ENCOURAGE_SLOW: string[] = [
  "完璧じゃなくていい。まず一言、口に出して。",
  "止まらないのが正解。短くていいから返して。",
];

/** シンプルなランダム選択（毎回同じにならない程度で十分）。 */
export function pick<T>(arr: T[], seed?: number): T {
  const i =
    seed != null
      ? seed % arr.length
      : Math.floor(Math.random() * arr.length);
  return arr[i] ?? arr[0]!;
}

/** 状態に対応するスプライト画像（public/fii/*.png）。 */
export const FII_SPRITE: Record<FiiState, string> = {
  idle: "/fii/idle.png",
  happy: "/fii/happy.png",
  thinking: "/fii/thinking.png",
  sleepy: "/fii/sleepy.png",
  master: "/fii/master.png",
  effect: "/fii/effect.png",
};
