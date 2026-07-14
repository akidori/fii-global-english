import type { AssessmentDimension, CEFR, WorkLevel, EvaluationAxis } from "@/types";

export const DIMENSION_LABEL: Record<AssessmentDimension, string> = {
  speaking: "話す",
  listening: "聞き取り",
  vocabulary: "語彙",
  grammar: "文法",
  pronunciation: "発音",
  business_response: "ビジネス応答",
  conversation_continuity: "会話継続",
  explanation_skill: "説明力",
};

export const AXIS_LABEL: Record<EvaluationAxis, string> = {
  meaning_clarity: "明快さ",
  grammar: "文法",
  naturalness: "自然さ",
  response_speed: "応答速度",
  conversation_continuity: "会話継続",
  business_appropriateness: "ビジネス適切さ",
  questioning_skill: "質問力",
  negotiation_skill: "交渉力",
  explanation_skill: "説明力",
  pronunciation: "発音",
};

export const CEFR_MEANING: Record<CEFR, string> = {
  A1: "単語と短い定型文で返答できる",
  A2: "簡単な自己紹介と確認ができる",
  B1: "仕事の内容を短く説明できる",
  B2: "商談や修正対応を継続できる",
  C1: "交渉や抽象的な企画説明ができる",
};

export const WORK_LEVEL_LABEL: Record<WorkLevel, string> = {
  1: "Survival",
  2: "Introduction",
  3: "Project Discussion",
  4: "Client Meeting",
  5: "Negotiation",
  6: "Global Project Lead",
};

export const WORK_LEVEL_JP: Record<WorkLevel, string> = {
  1: "生き延びる：単語で最低限やり取り",
  2: "自己紹介：名乗りと確認ができる",
  3: "案件の話：仕事内容を説明できる",
  4: "商談：会議を英語で回せる",
  5: "交渉：条件を英語で詰められる",
  6: "案件統括：海外案件をリードできる",
};
