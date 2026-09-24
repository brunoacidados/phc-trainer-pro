import "server-only";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { activity, cardProgress, missionProgress, quizAttempts } from "@/db/schema";
import { CARDS } from "@/content";
import { addDays, todayISO } from "@/domain/dates";
import type { CardState } from "@/domain/srs";
import type { MissionProgress, ProgressSnapshot } from "@/domain/progression";
import { currentLearnerId } from "./session";

export interface Dashboard {
  today: string;
  snapshot: ProgressSnapshot;
  dueCardIds: string[];
  newCardIds: string[];
  todayCount: number;
  activeDays: string[];
  bestQuiz: Record<number, number>;
}

const EMPTY: Omit<Dashboard, "today"> = {
  snapshot: { missions: {}, cards: {}, quizzesPassed: new Set() },
  dueCardIds: [],
  newCardIds: CARDS.map((c) => c.id),
  todayCount: 0,
  activeDays: [],
  bestQuiz: {},
};

/** Carrega tudo o que as páginas precisam numa ida à BD (4 queries em paralelo). */
export async function loadDashboard(): Promise<Dashboard> {
  const today = todayISO();
  const id = await currentLearnerId();
  if (!id) return { today, ...EMPTY, snapshot: { missions: {}, cards: {}, quizzesPassed: new Set() } };

  const [mp, cp, qa, act] = await Promise.all([
    db.select().from(missionProgress).where(eq(missionProgress.learnerId, id)),
    db.select().from(cardProgress).where(eq(cardProgress.learnerId, id)),
    db
      .select({ level: quizAttempts.level, best: sql<number>`max(${quizAttempts.pct})`, passed: sql<boolean>`bool_or(${quizAttempts.passed})` })
      .from(quizAttempts)
      .where(eq(quizAttempts.learnerId, id))
      .groupBy(quizAttempts.level),
    db
      .select({ day: activity.day, n: sql<number>`count(*)::int` })
      .from(activity)
      .where(and(eq(activity.learnerId, id), gte(activity.day, addDays(today, -6)), lte(activity.day, today)))
      .groupBy(activity.day),
  ]);

  const missions: Record<string, MissionProgress> = {};
  for (const r of mp) missions[r.missionId] = { steps: r.steps, proofs: r.proofs, reps: r.reps, due: r.due, mastered: r.mastered };

  const cards: Record<string, CardState> = {};
  for (const r of cp) cards[r.cardId] = { box: r.box, due: r.due, lapses: r.lapses, reviews: r.reviews };

  const known = new Set(CARDS.map((c) => c.id));
  const dueCardIds = cp
    .filter((r) => known.has(r.cardId) && r.due !== null && r.due <= today)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))
    .map((r) => r.cardId);
  const newCardIds = CARDS.filter((c) => !cards[c.id]).map((c) => c.id);

  const bestQuiz: Record<number, number> = {};
  const passed = new Set<number>();
  for (const r of qa) {
    bestQuiz[r.level] = Number(r.best);
    if (r.passed) passed.add(r.level);
  }

  return {
    today,
    snapshot: { missions, cards, quizzesPassed: passed },
    dueCardIds,
    newCardIds,
    todayCount: act.find((a) => a.day === today)?.n ?? 0,
    activeDays: act.map((a) => a.day),
    bestQuiz,
  };
}

export async function loadMissionProgress(missionId: string): Promise<MissionProgress | undefined> {
  const id = await currentLearnerId();
  if (!id) return undefined;
  const [r] = await db
    .select()
    .from(missionProgress)
    .where(and(eq(missionProgress.learnerId, id), eq(missionProgress.missionId, missionId)));
  return r ? { steps: r.steps, proofs: r.proofs, reps: r.reps, due: r.due, mastered: r.mastered } : undefined;
}

export async function recentQuizAttempts(level: number) {
  const id = await currentLearnerId();
  if (!id) return [];
  return db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.learnerId, id), eq(quizAttempts.level, level)))
    .orderBy(desc(quizAttempts.createdAt))
    .limit(3);
}
