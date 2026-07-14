"use client";

import { create } from "zustand";
import type {
  AppState,
  AppMode,
  UserProfile,
  Assessment,
  LearningSession,
  Phrase,
  ProjectBrief,
  DailyLog,
} from "@/types";
import { defaultState } from "@/lib/defaults";
import { loadState, saveState, clearState } from "@/lib/storage";
import { generatePlan } from "@/lib/plan-generator";
import { accrue, sessionXp } from "@/lib/gamification";
import { dailyGoalByLoad } from "@/lib/gamification";
import { masteredCount, gradeCorrect, gradeWrong, normalizeKey } from "@/lib/spaced-repetition";
import { todayISO } from "@/lib/date";
import { uid } from "@/lib/id";

interface Flash {
  streakUp: boolean;
  goalReached: boolean;
  leveledUp: boolean;
  xp: number;
}

interface StoreState extends AppState {
  hydrated: boolean;
  lastFlash: Flash | null;

  hydrate: () => void;
  setMode: (mode: AppMode) => void;
  setDailyGoal: (minutes: number) => void;

  saveProfile: (profile: UserProfile) => void;
  completeAssessment: (assessment: Assessment) => void;

  completeSession: (
    session: Omit<LearningSession, "id" | "xpEarned">,
    extractedPhrases?: Phrase[],
  ) => LearningSession;

  upsertPhrase: (phrase: Phrase) => void;
  gradePhrase: (id: string, correct: boolean) => void;
  removePhrase: (id: string) => void;

  addProject: (brief: ProjectBrief) => void;
  removeProject: (id: string) => void;

  clearFlash: () => void;
  resetAll: () => void;
}

/** state から永続する部分だけ抜き出して保存する。 */
function persist(get: () => StoreState): void {
  const s = get();
  const snapshot: AppState = {
    version: s.version,
    mode: s.mode,
    profile: s.profile,
    assessment: s.assessment,
    plan: s.plan,
    planStartDate: s.planStartDate,
    sessions: s.sessions,
    phrases: s.phrases,
    projects: s.projects,
    gamification: s.gamification,
    dailyLogs: s.dailyLogs,
  };
  saveState(snapshot);
}

export const useLearningStore = create<StoreState>((set, get) => ({
  ...defaultState(),
  hydrated: false,
  lastFlash: null,

  hydrate: () => {
    const loaded = loadState();
    set({ ...loaded, hydrated: true });
  },

  setMode: (mode) => {
    set({ mode });
    persist(get);
  },

  setDailyGoal: (minutes) => {
    set((s) => ({
      gamification: { ...s.gamification, dailyGoalMinutes: minutes },
    }));
    persist(get);
  },

  saveProfile: (profile) => {
    set((s) => ({
      profile,
      gamification: {
        ...s.gamification,
        dailyGoalMinutes: dailyGoalByLoad[profile.dailyLoad],
      },
    }));
    persist(get);
  },

  completeAssessment: (assessment) => {
    const profile = get().profile;
    if (!profile) {
      set({ assessment });
      persist(get);
      return;
    }
    const plan = generatePlan(profile, assessment);
    set({
      assessment,
      plan,
      planStartDate: todayISO(),
    });
    persist(get);
  },

  completeSession: (input, extractedPhrases = []) => {
    const xpEarned = sessionXp(
      averageOf(Object.values(input.scores)),
      input.turns.filter((t) => t.role === "user").length,
    );
    const session: LearningSession = {
      ...input,
      id: uid("ses"),
      xpEarned,
    };

    // フレーズを重複排除しつつ追加
    const phrases = mergePhrases(get().phrases, extractedPhrases);

    // ゲーミフィケーション反映
    const minutes = Math.max(1, Math.round(input.durationSec / 60));
    const { next, streakUp, goalReached, leveledUp } = accrue(
      get().gamification,
      minutes,
      xpEarned,
      masteredCount(phrases),
    );
    next.totalSessions += 1;

    // デイリーログ
    const dailyLogs = upsertDailyLog(get().dailyLogs, {
      date: todayISO(),
      minutes,
      xp: xpEarned,
      sessions: 1,
      avgScore: averageOf(Object.values(input.scores)),
    });

    set((s) => ({
      sessions: [session, ...s.sessions].slice(0, 200),
      phrases,
      gamification: next,
      dailyLogs,
      lastFlash: { streakUp, goalReached, leveledUp, xp: xpEarned },
    }));
    persist(get);
    return session;
  },

  upsertPhrase: (phrase) => {
    set((s) => ({ phrases: mergePhrases(s.phrases, [phrase]) }));
    persist(get);
  },

  gradePhrase: (id, correct) => {
    set((s) => {
      const phrases = s.phrases.map((p) =>
        p.id === id ? (correct ? gradeCorrect(p) : gradeWrong(p)) : p,
      );
      return {
        phrases,
        gamification: {
          ...s.gamification,
          masteredPhrases: masteredCount(phrases),
        },
      };
    });
    persist(get);
  },

  removePhrase: (id) => {
    set((s) => ({ phrases: s.phrases.filter((p) => p.id !== id) }));
    persist(get);
  },

  addProject: (brief) => {
    set((s) => ({ projects: [brief, ...s.projects] }));
    persist(get);
  },

  removeProject: (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    persist(get);
  },

  clearFlash: () => set({ lastFlash: null }),

  resetAll: () => {
    clearState();
    set({ ...defaultState(), hydrated: true, lastFlash: null });
  },
}));

// ---- helpers ---------------------------------------------

function averageOf(vals: (number | undefined)[]): number {
  const nums = vals.filter((v): v is number => typeof v === "number");
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function mergePhrases(existing: Phrase[], incoming: Phrase[]): Phrase[] {
  const byKey = new Map<string, Phrase>();
  for (const p of existing) byKey.set(normalizeKey(p.english), p);
  for (const p of incoming) {
    const key = normalizeKey(p.english);
    const prev = byKey.get(key);
    if (prev) {
      // 既存があれば mistake を加算し、より低い mastery を尊重
      byKey.set(key, {
        ...prev,
        mistakeCount: prev.mistakeCount + p.mistakeCount,
        mastery: Math.min(prev.mastery, p.mastery),
        source: prev.source === "seed" ? p.source : prev.source,
      });
    } else {
      byKey.set(key, p);
    }
  }
  return Array.from(byKey.values());
}

function upsertDailyLog(logs: DailyLog[], add: DailyLog): DailyLog[] {
  const idx = logs.findIndex((l) => l.date === add.date);
  if (idx === -1) return [add, ...logs].slice(0, 120);
  const prev = logs[idx]!;
  const merged: DailyLog = {
    date: add.date,
    minutes: prev.minutes + add.minutes,
    xp: prev.xp + add.xp,
    sessions: prev.sessions + add.sessions,
    avgScore: Math.round((prev.avgScore + add.avgScore) / 2),
  };
  const next = logs.slice();
  next[idx] = merged;
  return next;
}
