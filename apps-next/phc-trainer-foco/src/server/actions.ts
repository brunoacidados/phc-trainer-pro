"use server";
/**
 * Server Actions — todas as escritas passam por aqui.
 * Princípios:
 *  - Validar tudo no servidor (ids existem, índices dentro dos limites).
 *  - Regras de domínio (SRS, domínio, pontuação) vêm de src/domain — nunca do cliente.
 *  - Devolver resultados explícitos ({ ok, message }) para a UI dar feedback claro.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { activity, cardProgress, missionProgress, quizAttempts } from "@/db/schema";
import { cardById, missionById, quizOfLevel } from "@/content";
import { exampleBySlug } from "@/content/examples";
import { relativeDay, todayISO } from "@/domain/dates";
import { NEW_CARD, registerRep, reviewCard, type Rating } from "@/domain/srs";
import { EMPTY_MISSION, masteryBlockers, scoreQuiz, type MissionProgress } from "@/domain/progression";
import { PREFS_COOKIE, parsePrefs, type Prefs } from "@/lib/prefs";
import { requireLearner } from "./session";

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

async function log(learnerId: string, kind: string, ref: string) {
  await db.insert(activity).values({ learnerId, day: todayISO(), kind, ref });
}

async function getMission(learnerId: string, missionId: string): Promise<MissionProgress> {
  const [r] = await db
    .select()
    .from(missionProgress)
    .where(and(eq(missionProgress.learnerId, learnerId), eq(missionProgress.missionId, missionId)));
  return r ? { steps: r.steps, proofs: r.proofs, reps: r.reps, due: r.due, mastered: r.mastered } : { ...EMPTY_MISSION, steps: [], proofs: [] };
}

async function saveMission(learnerId: string, missionId: string, p: MissionProgress) {
  const values = { steps: p.steps, proofs: p.proofs, reps: p.reps, due: p.due, mastered: p.mastered, updatedAt: new Date() };
  await db
    .insert(missionProgress)
    .values({ learnerId, missionId, ...values })
    .onConflictDoUpdate({ target: [missionProgress.learnerId, missionProgress.missionId], set: values });
}

function toggleIndex(list: number[], i: number, on: boolean): number[] {
  const set = new Set(list);
  if (on) set.add(i);
  else set.delete(i);
  return [...set].sort((a, b) => a - b);
}

export async function toggleChecklistItem(missionId: string, kind: "steps" | "proofs", index: number, done: boolean): Promise<ActionResult> {
  const mission = missionById(missionId);
  if (!mission) return { ok: false, message: "Missão não encontrada." };
  const max = kind === "steps" ? mission.steps.length : mission.proofs.length;
  if (!Number.isInteger(index) || index < 0 || index >= max) return { ok: false, message: "Item inválido." };

  const learnerId = await requireLearner();
  const p = await getMission(learnerId, missionId);
  const before = p[kind].includes(index);
  p[kind] = toggleIndex(p[kind], index, done);
  await saveMission(learnerId, missionId, p);
  if (done && !before) await log(learnerId, kind === "steps" ? "passo" : "prova", missionId);
  revalidatePath(`/missao/${missionId}`);
  return { ok: true };
}

export async function recordRepetition(missionId: string): Promise<ActionResult> {
  const mission = missionById(missionId);
  if (!mission) return { ok: false, message: "Missão não encontrada." };
  const learnerId = await requireLearner();
  const p = await getMission(learnerId, missionId);
  const today = todayISO();
  const outcome = registerRep({ reps: p.reps, due: p.due }, today);
  if (!outcome.advanced) {
    return {
      ok: true,
      message: `Treino extra registado. A próxima repetição que conta é ${relativeDay(outcome.nextCounts, today)} — espaçar é o que fixa.`,
    };
  }
  await saveMission(learnerId, missionId, { ...p, reps: outcome.state.reps, due: outcome.state.due });
  await log(learnerId, "repeticao", missionId);
  revalidatePath(`/missao/${missionId}`);
  revalidatePath("/");
  return { ok: true, message: `Repetição ${outcome.state.reps} registada. Próxima: ${relativeDay(outcome.state.due!, today)}.` };
}

export async function markMastered(missionId: string): Promise<ActionResult> {
  const mission = missionById(missionId);
  if (!mission) return { ok: false, message: "Missão não encontrada." };
  const learnerId = await requireLearner();
  const p = await getMission(learnerId, missionId);
  const blockers = masteryBlockers(mission, p);
  if (blockers.length) return { ok: false, message: `Ainda falta: ${blockers.join(" · ")}` };
  await saveMission(learnerId, missionId, { ...p, mastered: true });
  await log(learnerId, "dominio", missionId);
  revalidatePath("/", "layout");
  return { ok: true, message: "Missão dominada. Bom trabalho — isto ficou com prova." };
}

export async function rateCardAction(cardId: string, rating: Rating): Promise<ActionResult> {
  if (!cardById(cardId)) return { ok: false, message: "Carta não encontrada." };
  if (![0, 1, 2].includes(rating)) return { ok: false, message: "Avaliação inválida." };
  const learnerId = await requireLearner();
  const [r] = await db
    .select()
    .from(cardProgress)
    .where(and(eq(cardProgress.learnerId, learnerId), eq(cardProgress.cardId, cardId)));
  const prev = r ? { box: r.box, due: r.due, lapses: r.lapses, reviews: r.reviews } : NEW_CARD;
  const next = reviewCard(prev, rating, todayISO());
  const values = { ...next, updatedAt: new Date() };
  await db
    .insert(cardProgress)
    .values({ learnerId, cardId, ...values })
    .onConflictDoUpdate({ target: [cardProgress.learnerId, cardProgress.cardId], set: values });
  await log(learnerId, "carta", cardId);
  return { ok: true };
}

export interface QuizResult {
  correct: number;
  total: number;
  pct: number;
  passed: boolean;
}

export async function submitQuizAction(level: number, answers: number[]): Promise<QuizResult | { error: string }> {
  const quiz = quizOfLevel(level);
  if (!quiz) return { error: "Teste não encontrado." };
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length || answers.some((a) => !Number.isInteger(a)))
    return { error: "Respostas inválidas." };
  const learnerId = await requireLearner();
  const result = scoreQuiz(
    quiz.questions.map((q) => q.answer),
    answers,
  );
  await db.insert(quizAttempts).values({ learnerId, level, ...result });
  await log(learnerId, "teste", String(level));
  revalidatePath("/", "layout");
  return result;
}

export async function markExampleStudied(slug: string): Promise<ActionResult> {
  if (!exampleBySlug(slug)) return { ok: false, message: "Exemplo não encontrado." };
  const learnerId = await requireLearner();
  const [already] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(activity)
    .where(and(eq(activity.learnerId, learnerId), eq(activity.kind, "exemplo"), eq(activity.ref, slug), eq(activity.day, todayISO())));
  if (!already?.n) await log(learnerId, "exemplo", slug);
  return { ok: true, message: "Exemplo marcado como estudado." };
}

export async function savePrefs(partial: Partial<Prefs>): Promise<void> {
  const jar = await cookies();
  const merged = parsePrefs(JSON.stringify({ ...parsePrefs(jar.get(PREFS_COOKIE)?.value), ...partial }));
  jar.set({ name: PREFS_COOKIE, value: JSON.stringify(merged), path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 400 });
  revalidatePath("/", "layout");
}
