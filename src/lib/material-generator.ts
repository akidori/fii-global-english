import type { ProjectBrief, ProjectMaterial } from "@/types";

// ============================================================
// 実案件ブリーフから商談用の英語教材を生成（mock）。
// AI モードでは /api/plan に投げて上書きできるが、鍵無しでも動く。
// ============================================================

export function generateMaterial(b: ProjectBrief): ProjectMaterial {
  const client = b.clientName || "the client";
  const goal = b.videoGoal || "achieve their business goal";
  const target = b.target || "their audience";

  return {
    intro: [
      "Hi, I'm a video director based in Japan.",
      "I make documentaries and brand videos, from planning to editing.",
      `I'm excited to help ${client} tell their story.`,
    ].join(" "),

    planPitch: [
      `The main goal of this video is to ${goal}.`,
      `We focus on ${target} and keep the message simple.`,
      "We open with a real moment to build trust, then show the result.",
    ].join(" "),

    confirmPhrases: [
      "Let me confirm the main goal of this video.",
      `Who exactly is the target — is it ${target}?`,
      "Could you tell me more specifically what success looks like?",
      "What is the deadline you have in mind?",
    ],

    expectedQuestions: buildExpectedQuestions(b),

    cheatSheet: [
      "Keep sentences short. One idea per sentence.",
      "If stuck: \"Let me think for a second.\"",
      "If unclear: \"You mean ...?\" / \"Could you say that again?\"",
      `Goal line: \"The main goal is to ${goal}.\"`,
      "On price: \"I can do X, but it affects Y.\"",
      "Close: \"Let me send a short summary after this call.\"",
    ],

    followUp: [
      `Hi ${client}, thank you for the call today.`,
      `To confirm: the goal is to ${goal}, targeting ${target}.`,
      b.deadline ? `We aim to deliver by ${b.deadline}.` : "I'll share a proposed timeline shortly.",
      "Please let me know if I missed anything. Looking forward to working together.",
    ].join(" "),
  };
}

function buildExpectedQuestions(b: ProjectBrief): string[] {
  const base = [
    "Can you make it more emotional?",
    "Can we make it feel more premium?",
    "What's included in your price?",
    "How many revisions do we get?",
    "Can you deliver it faster?",
  ];
  if (b.expectedQuestions?.trim()) {
    const extra = b.expectedQuestions
      .split(/\n|,|、/)
      .map((s) => s.trim())
      .filter(Boolean);
    return [...extra, ...base].slice(0, 8);
  }
  return base;
}
