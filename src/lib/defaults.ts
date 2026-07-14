import type { AppState, Gamification } from "@/types";
import { todayISO } from "@/lib/date";

export const STORAGE_KEY = "fii-global-english:v1";
export const STATE_VERSION = 1;

export function defaultGamification(): Gamification {
  return {
    xp: 0,
    level: 1,
    streakDays: 0,
    lastStudyDate: "",
    freezes: 2,
    dailyGoalMinutes: 15,
    todayMinutes: 0,
    todayDate: todayISO(),
    badges: [],
    totalSessions: 0,
    masteredPhrases: 0,
  };
}

export function defaultState(): AppState {
  return {
    version: STATE_VERSION,
    mode:
      (process.env.NEXT_PUBLIC_DEFAULT_MODE as AppState["mode"]) === "ai"
        ? "ai"
        : "mock",
    profile: null,
    assessment: null,
    plan: null,
    planStartDate: null,
    sessions: [],
    phrases: [],
    projects: [],
    gamification: defaultGamification(),
    dailyLogs: [],
  };
}
