// ============================================================
// Fii Global English — 型定義（データモデルの正本）
// ============================================================

export type AppMode = "mock" | "ai";

// ---- オンボーディング / プロフィール ----------------------

export type Deadline = "3m" | "6m" | "1y";
export type WeeklyMinutes = 75 | 120 | 180 | 300;
export type DailyLoad = "light" | "standard" | "focus"; // 10 / 15 / 25 分
export type PriorityScene =
  | "intro_portfolio"
  | "first_meeting"
  | "plan_direction"
  | "on_set"
  | "revision"
  | "negotiation";
export type Weakness =
  | "cant_speak_fast"
  | "cant_listen"
  | "grammar"
  | "pronunciation"
  | "nervous"
  | "cant_explain_work";
export type LearningStyle =
  | "voice"
  | "roleplay"
  | "text"
  | "real_material"
  | "balanced";

export interface UserProfile {
  name: string;
  roles: string[];
  goal: string;
  deadline: Deadline;
  weeklyMinutes: WeeklyMinutes;
  dailyLoad: DailyLoad;
  priorityScene: PriorityScene;
  weakness: Weakness;
  learningStyle: LearningStyle;
  createdAt: string;
}

// ---- 英語力診断 -------------------------------------------

export type AssessmentDimension =
  | "speaking"
  | "listening"
  | "vocabulary"
  | "grammar"
  | "pronunciation"
  | "business_response"
  | "conversation_continuity"
  | "explanation_skill";

export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1";
export type WorkLevel = 1 | 2 | 3 | 4 | 5 | 6; // Survival..Global Project Lead

export interface AssessmentAnswer {
  questionId: string;
  value: string; // 選択肢id / 自由入力テキスト
  selfRatedScore?: number; // 自己回答型の推定スコア(0-100)
}

export interface Assessment {
  level: CEFR;
  workLevel: WorkLevel;
  scores: Partial<Record<AssessmentDimension, number>>; // 0-100
  answers: AssessmentAnswer[];
  completedAt: string;
}

// ---- 学習プラン -------------------------------------------

export type LearningPhaseId = 1 | 2 | 3 | 4;

export interface LearningPhase {
  id: LearningPhaseId;
  title: string;
  goals: string[];
  done: boolean;
}

export interface LearningPlan {
  goal: string;
  deadline: Deadline;
  currentLevel: CEFR;
  currentWorkLevel: WorkLevel;
  targetLevel: CEFR;
  targetWorkLevel: WorkLevel;
  weeklyMinutes: number;
  dailyMinutes: number;
  weeklyDays: number;
  focusScene: PriorityScene;
  focusSkills: AssessmentDimension[];
  skillAllocation: Partial<Record<AssessmentDimension, number>>; // %
  phases: LearningPhase[];
  weeklyChecklist: string[];
  createdAt: string;
}

// ---- 週テーマ --------------------------------------------

export interface WeekTheme {
  weekIndex: number; // プラン開始からの週番号(0-)
  scene: PriorityScene;
  title: string;
  days: string[]; // 7日分のねらい
}

// ---- 学習セッション --------------------------------------

export interface TurnEvaluation {
  scores: Partial<Record<EvaluationAxis, number>>; // 0-100（内部用・複数記録）
  understood: string; // 何が伝わったか
  topImprovement: string; // 最も重要な改善点（1つ）
  naturalVersion: string; // より自然な短い英文
  nextInfo: string; // 次に加えるべき情報
  followUpQuestion: string; // 続けて答えるための質問
}

export type EvaluationAxis =
  | "meaning_clarity"
  | "grammar"
  | "naturalness"
  | "response_speed"
  | "conversation_continuity"
  | "business_appropriateness"
  | "questioning_skill"
  | "negotiation_skill"
  | "explanation_skill"
  | "pronunciation";

export interface SessionTurn {
  role: "fii" | "user";
  text: string;
  ms?: number; // 回答までの所要時間
  evaluation?: TurnEvaluation;
}

export interface LearningSession {
  id: string;
  date: string;
  scenarioId: string;
  scenarioTitle: string;
  turns: SessionTurn[];
  scores: Partial<Record<EvaluationAxis, number>>; // セッション平均
  durationSec: number;
  xpEarned: number;
  completedAt?: string;
}

// ---- フレーズ / 復習 --------------------------------------

export type PhraseCategory =
  | "intro"
  | "portfolio"
  | "hearing"
  | "planning"
  | "on_set"
  | "interview"
  | "editing"
  | "revision"
  | "negotiation"
  | "smalltalk"
  | "keep_going"; // 会話を止めない繋ぎ表現

export type PhraseSource =
  | "could_not_say" // 言えなかった
  | "mistake" // 間違えた
  | "slow" // 返答が遅かった
  | "repeated_mistake"
  | "high_frequency"
  | "saved" // ユーザー保存
  | "pronunciation" // 発音が不安定
  | "seed";

export interface Phrase {
  id: string;
  english: string;
  japanese: string;
  category: PhraseCategory;
  source: PhraseSource;
  mastery: number; // 0-5（間隔反復の段階）
  reviewDate: string; // 次回復習日(ISO date)
  mistakeCount: number;
  createdAt: string;
  lastReviewedAt?: string;
}

// ---- シナリオ（ロールプレイ）------------------------------

export interface ScenarioSeedQuestion {
  fii: string; // クライアント役 Fii の発話（英語）
  jp: string; // 日本語補助
  hint?: string; // 返答の型ヒント
}

export interface Scenario {
  id: string;
  title: string; // 日本語表示名
  titleEn: string;
  category: PhraseCategory;
  scene: PriorityScene;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  clientRole: string; // Fii が演じるクライアント像
  goal: string; // このロールプレイのゴール
  opening: ScenarioSeedQuestion; // 冒頭のFii発話
  questions: ScenarioSeedQuestion[]; // 追撃質問の種
  keyPhraseIds: string[]; // 事前に押さえる表現
}

// ---- 実案件 ----------------------------------------------

export interface ProjectBrief {
  id: string;
  clientName: string;
  industry: string;
  videoGoal: string;
  target: string;
  shootDate?: string;
  meetingDate?: string;
  deadline?: string;
  expectedQuestions?: string;
  notes?: string;
  createdAt: string;
}

export interface ProjectMaterial {
  intro: string; // 自己紹介
  planPitch: string; // 企画説明
  confirmPhrases: string[]; // 確認フレーズ
  expectedQuestions: string[]; // 想定質問(英)
  cheatSheet: string[]; // 当日カンペ
  followUp: string; // 会議後フォローアップ文
}

// ---- ゲーミフィケーション（Duolingo要素）------------------

export interface Gamification {
  xp: number;
  level: number; // XPから算出したアプリ内レベル
  streakDays: number;
  lastStudyDate: string; // ISO date（ストリーク判定）
  freezes: number; // ストリークフリーズ在庫
  dailyGoalMinutes: number;
  todayMinutes: number;
  todayDate: string; // 今日の分数が指す日付
  badges: string[];
  totalSessions: number;
  masteredPhrases: number; // mastery>=4 の数のスナップショット
}

// ---- 進捗ログ（成長記録）----------------------------------

export interface DailyLog {
  date: string;
  minutes: number;
  xp: number;
  sessions: number;
  avgScore: number;
}

// ---- アプリ全体の永続状態 ---------------------------------

export interface AppState {
  version: number;
  mode: AppMode;
  profile: UserProfile | null;
  assessment: Assessment | null;
  plan: LearningPlan | null;
  planStartDate: string | null;
  sessions: LearningSession[];
  phrases: Phrase[];
  projects: ProjectBrief[];
  gamification: Gamification;
  dailyLogs: DailyLog[];
}
