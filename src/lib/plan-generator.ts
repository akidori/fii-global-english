import type {
  UserProfile,
  Assessment,
  LearningPlan,
  LearningPhase,
  AssessmentDimension,
  PriorityScene,
  Weakness,
  CEFR,
  WorkLevel,
  WeekTheme,
} from "@/types";
import { dailyGoalByLoad } from "@/lib/gamification";
import { todayISO } from "@/lib/date";

// ============================================================
// 学習プラン生成: オンボーディング + 診断 を統合し個別計画を作る。
// 「毎週1つの仕事場面に集中」を前提にフェーズと配分を決める。
// ============================================================

export const SCENE_LABEL: Record<PriorityScene, string> = {
  intro_portfolio: "自己紹介とポートフォリオ説明",
  first_meeting: "海外クライアントとの初回商談",
  plan_direction: "企画・構成・演出意図の説明",
  on_set: "撮影現場での指示",
  revision: "修正依頼への対応",
  negotiation: "価格・納期・修正範囲の交渉",
};

const WEAKNESS_SKILL: Record<Weakness, AssessmentDimension[]> = {
  cant_speak_fast: ["speaking", "conversation_continuity"],
  cant_listen: ["listening", "conversation_continuity"],
  grammar: ["grammar", "explanation_skill"],
  pronunciation: ["pronunciation", "speaking"],
  nervous: ["conversation_continuity", "speaking"],
  cant_explain_work: ["explanation_skill", "business_response"],
};

const SCENE_SKILL: Record<PriorityScene, AssessmentDimension[]> = {
  intro_portfolio: ["explanation_skill", "speaking"],
  first_meeting: ["business_response", "conversation_continuity"],
  plan_direction: ["explanation_skill", "speaking"],
  on_set: ["speaking", "conversation_continuity"],
  revision: ["business_response", "listening"],
  negotiation: ["business_response", "conversation_continuity"],
};

function targetLevels(level: CEFR, work: WorkLevel): {
  targetLevel: CEFR;
  targetWorkLevel: WorkLevel;
} {
  const order: CEFR[] = ["A1", "A2", "B1", "B2", "C1"];
  const idx = order.indexOf(level);
  const targetLevel = order[Math.min(order.length - 1, idx + 1)] ?? "B2";
  const targetWorkLevel = Math.min(6, work + 2) as WorkLevel;
  return { targetLevel, targetWorkLevel };
}

function buildPhases(scene: PriorityScene): LearningPhase[] {
  return [
    {
      id: 1,
      title: "会話を止めない基礎",
      goals: [
        "英語で自己紹介ができる",
        "分からない時に聞き返せる",
        "相手の発言を確認できる",
        "時間を稼ぐ表現を使える",
        "完璧でなくても返答できる",
      ],
      done: false,
    },
    {
      id: 2,
      title: "仕事場面の型を作る",
      goals: [
        "仕事内容を短く説明できる",
        "ポートフォリオを説明できる",
        `${SCENE_LABEL[scene]}の型を身につける`,
        "撮影指示・修正対応の基本表現を使える",
      ],
      done: false,
    },
    {
      id: 3,
      title: "案件を通して話す",
      goals: [
        "10〜20分の模擬商談を最後まで進める",
        "複数の質問に返答できる",
        "相手に質問して要件を引き出せる",
        "会議の要点と次アクションを整理できる",
      ],
      done: false,
    },
    {
      id: 4,
      title: "海外案件の実戦",
      goals: [
        "価格・納期・修正範囲を交渉できる",
        "トラブルに英語で対応できる",
        "雑談で関係を築ける",
        "案件をクロージングできる",
      ],
      done: false,
    },
  ];
}

function uniqueSkills(...groups: AssessmentDimension[][]): AssessmentDimension[] {
  const seen = new Set<AssessmentDimension>();
  const out: AssessmentDimension[] = [];
  for (const g of groups) for (const s of g) if (!seen.has(s)) (seen.add(s), out.push(s));
  return out;
}

export function generatePlan(
  profile: UserProfile,
  assessment: Assessment,
): LearningPlan {
  const dailyMinutes = dailyGoalByLoad[profile.dailyLoad];
  const weeklyDays = Math.max(
    3,
    Math.min(7, Math.round(profile.weeklyMinutes / dailyMinutes)),
  );
  const { targetLevel, targetWorkLevel } = targetLevels(
    assessment.level,
    assessment.workLevel,
  );

  const focusSkills = uniqueSkills(
    WEAKNESS_SKILL[profile.weakness],
    SCENE_SKILL[profile.priorityScene],
  ).slice(0, 4);

  // 重点スキルへ多め、残りを基礎へ配分（合計100%）
  const skillAllocation: LearningPlan["skillAllocation"] = {};
  const primary = focusSkills.slice(0, 2);
  const secondary = focusSkills.slice(2);
  primary.forEach((s) => (skillAllocation[s] = 30));
  secondary.forEach((s) => (skillAllocation[s] = 15));
  const used = Object.values(skillAllocation).reduce((a, b) => a + (b ?? 0), 0);
  skillAllocation.conversation_continuity =
    (skillAllocation.conversation_continuity ?? 0) + Math.max(0, 100 - used);

  return {
    goal: profile.goal,
    deadline: profile.deadline,
    currentLevel: assessment.level,
    currentWorkLevel: assessment.workLevel,
    targetLevel,
    targetWorkLevel,
    weeklyMinutes: profile.weeklyMinutes,
    dailyMinutes,
    weeklyDays,
    focusScene: profile.priorityScene,
    focusSkills,
    skillAllocation,
    phases: buildPhases(profile.priorityScene),
    weeklyChecklist: [
      "今週の場面の重要表現を10個言える",
      "1文を短く言い直せる",
      "相手の質問を1つ聞き取れる",
      "5分間ロールプレイを止めずに続けられる",
    ],
    createdAt: todayISO(),
  };
}

/** プラン開始からの経過に応じた「今週のテーマ」を返す。 */
export function currentWeekTheme(
  plan: LearningPlan,
  weekIndex: number,
): WeekTheme {
  const scene = plan.focusScene;
  return {
    weekIndex,
    scene,
    title: `${SCENE_LABEL[scene]}`,
    days: [
      "重要表現を理解する",
      "短文で答える",
      "相手の質問を聞き取る",
      "追加質問に答える",
      "5分間ロールプレイ",
      "実際の案件資料で練習する",
      "週間チェックと復習",
    ],
  };
}
