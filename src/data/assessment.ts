import type { AssessmentDimension } from "@/types";

// ============================================================
// 英語力診断の設問。id は "dimension:key" 形式（集計でdimに分解）。
// 産出系(話す/説明/発音)は自己評価+実入力、受容系(聞く/理解)は選択式。
// ============================================================

export type AssessmentQKind = "free" | "choice" | "slider";

export interface AssessmentOption {
  id: string;
  label: string;
  correct?: boolean;
}

export interface AssessmentQuestion {
  id: `${AssessmentDimension}:${string}`;
  kind: AssessmentQKind;
  title: string; // 日本語の指示
  english?: string; // 刺激文（聞き取り/理解問題）
  jp?: string; // 補助
  hint?: string;
  placeholder?: string;
  options?: AssessmentOption[];
  sliderLabels?: [string, string];
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "speaking:intro",
    kind: "free",
    title: "英語で、あなたの仕事を短く説明してください（60秒相当）。",
    hint: "I'm a ... / I make ... / I handle ... の3文で十分。",
    placeholder: "I'm a video director based in Japan. I make ...",
  },
  {
    id: "explanation_skill:portfolio",
    kind: "free",
    title: "制作した動画を1本、英語で説明してください。",
    jp: "誰のため / 課題 / どんな企画 / どんな成果 の順で。",
    hint: "This video was made for ... The challenge was ...",
    placeholder: "This video was made for a clinic. The challenge was ...",
  },
  {
    id: "listening:req",
    kind: "choice",
    title: "クライアントの要望です。要点はどれ？",
    english: "\"The video looks nice, but it feels too long. Can we make it punchier and get to the point faster?\"",
    options: [
      { id: "a", label: "動画が短すぎるので長くしたい" },
      { id: "b", label: "テンポを上げて要点を早く見せたい", correct: true },
      { id: "c", label: "色味を明るくしたい" },
      { id: "d", label: "BGMを変えたい" },
    ],
  },
  {
    id: "business_response:budget",
    kind: "choice",
    title: "\"Your proposal is above our budget.\" への最適な返しは？",
    options: [
      { id: "a", label: "No problem, I'll do it for free." },
      { id: "b", label: "I can adjust the scope to fit your budget.", correct: true },
      { id: "c", label: "Your budget is too low." },
      { id: "d", label: "Sorry, I cannot help you." },
    ],
  },
  {
    id: "business_response:quick",
    kind: "free",
    title: "瞬間英作文：「対応できますが、納期に影響する可能性があります」",
    hint: "I can do that, but ...",
    placeholder: "I can do that, but it may affect the deadline.",
  },
  {
    id: "conversation_continuity:hearing",
    kind: "free",
    title: "瞬間英作文：「もう少し具体的に説明していただけますか？」",
    hint: "Could you ...?",
    placeholder: "Could you explain that a bit more specifically?",
  },
  {
    id: "grammar:quick",
    kind: "choice",
    title: "文法：自然なのはどれ？",
    options: [
      { id: "a", label: "I working on a documentary now." },
      { id: "b", label: "I'm working on a documentary right now.", correct: true },
      { id: "c", label: "I am work on documentary now." },
      { id: "d", label: "I works on a documentary now." },
    ],
  },
  {
    id: "vocabulary:film",
    kind: "choice",
    title: "語彙：「粗編集（最初のラフな編集）」に最も近いのは？",
    options: [
      { id: "a", label: "rough cut", correct: true },
      { id: "b", label: "final master" },
      { id: "c", label: "color grade" },
      { id: "d", label: "thumbnail" },
    ],
  },
  {
    id: "pronunciation:self",
    kind: "slider",
    title: "発音の自信度は？（相手に一度で聞き取ってもらえる感覚）",
    sliderLabels: ["よく聞き返される", "ほぼ問題ない"],
  },
];
