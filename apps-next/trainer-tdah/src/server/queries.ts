import "server-only";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { CARDS, cardKey } from "@/content";
import { db } from "@/db";
import { activity, cardProgress, missionProgress, quizAttempts, type Profile } from "@/db/schema";
import { addDays, todayISO } from "@/domain/dates";
import type { MissionState, QuizState, Snapshot } from "@/domain/progression";
import { isCardMastered, type ReviewState } from "@/domain/srs";

export function profileToday(p: Profile): string {
  return todayISO(p.timeZone);
}

export async function loadMissionStates(profileId: string): Promise<Record<string, MissionState & { notes: string }>> {
  const rows = await db.select().from(missionProgress).where(eq(missionProgress.profileId, profileId));
  const out: Record<string, MissionState & { notes: string }> = {};
  for (const r of rows) {
    out[r.missionId] = {
      steps: r.steps ?? [],
      proofs: r.proofs ?? [],
      box: r.box,
      reps: r.reps,
      due: r.due,
      mastered: r.mastered,
      lastRep: r.lastRep,
      notes: r.notes,
    };
  }
  return out;
}

export async function loadCardStates(profileId: string): Promise<Record<string, ReviewState>> {
  const rows = await db.select().from(cardProgress).where(eq(cardProgress.profileId, profileId));
  const out: Record<string, ReviewState> = {};
  for (const r of rows) out[r.cardKey] = { box: r.box, due: r.due, lapses: r.lapses, reviews: r.reviews };
  return out;
}

export async function loadQuizStates(profileId: string): Promise<Record<number, QuizState>> {
  const rows = await db
    .select({
      level: quizAttempts.level,
      best: sql<number>`max(${quizAttempts.pct})`.mapWith(Number),
      passed: sql<boolean>`bool_or(${quizAttempts.passed})`,
      tries: count(),
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.profileId, profileId))
    .groupBy(quizAttempts.level);
  const out: Record<number, QuizState> = {};
  for (const r of rows) out[r.level] = { best: r.best, passed: !!r.passed, tries: Number(r.tries) };
  return out;
}

export async function loadSnapshot(p: Profile): Promise<Snapshot> {
  const today = profileToday(p);
  const [missions, cards, quizzes] = await Promise.all([
    loadMissionStates(p.id),
    loadCardStates(p.id),
    loadQuizStates(p.id),
  ]);
  let cardsDue = 0;
  let cardsNew = 0;
  let cardsMastered = 0;
  for (const c of CARDS) {
    const st = cards[cardKey(c)];
    if (!st) cardsNew++;
    else if (isCardMastered(st)) cardsMastered++;
    else if (st.due <= today) cardsDue++;
  }
  return { missions, cardsDue, cardsNew, cardsMastered, quizzes, freeMode: p.freeMode, today };
}

/** Nº de micro-ações por dia nos últimos n dias. */
export async function loadActivityByDay(p: Profile, days: number): Promise<Record<string, number>> {
  const today = profileToday(p);
  const from = addDays(today, -(days - 1));
  const rows = await db
    .select({ day: activity.day, n: count() })
    .from(activity)
    .where(and(eq(activity.profileId, p.id), gte(activity.day, from)))
    .groupBy(activity.day);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.day] = Number(r.n);
  return out;
}
