"use server";

/**
 * Server Actions — todas as mutações passam por aqui.
 * Princípios: validar entrada, nunca confiar no cliente (ex.: pontuação de testes
 * é recalculada no servidor), registar a micro-ação para a meta diária.
 */
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cardByKey, labById, quizForLevel } from "@/content";
import { db } from "@/db";
import { activity, cardProgress, missionProgress, profiles, quizAttempts } from "@/db/schema";
import { applyMissionRep, emptyMission, scoreQuiz } from "@/domain/progression";
import { canMarkMastered, newReviewState, review, type Rating } from "@/domain/srs";
import { profileToday } from "./queries";
import { clearProfileCookie, isUuid, requireProfile, setProfileCookie } from "./session";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isRating(v: unknown): v is Rating {
  return v === 0 || v === 1 || v === 2;
}

async function logActivity(profileId: string, day: string, kind: string, ref: string) {
  await db.insert(activity).values({ profileId, day, kind, ref });
}

/* ---------------- perfil ---------------- */

export async function createProfile(_: unknown, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const goal = Number(formData.get("dailyGoal") ?? 3);
  if (name.length < 2 || name.length > 40) return { ok: false, error: "Escreva um nome entre 2 e 40 letras." };
  const dailyGoal = Number.isInteger(goal) && goal >= 1 && goal <= 10 ? goal : 3;
  const [p] = await db.insert(profiles).values({ name, dailyGoal }).returning({ id: profiles.id });
  await setProfileCookie(p.id);
  redirect("/");
}

export async function restoreProfile(_: unknown, formData: FormData): Promise<ActionResult> {
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  if (!isUuid(code)) return { ok: false, error: "Esse código não tem o formato certo. Copie-o das Definições." };
  const rows = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, code)).limit(1);
  if (!rows[0]) return { ok: false, error: "Não encontrei nenhum perfil com esse código." };
  await setProfileCookie(rows[0].id);
  redirect("/");
}

export async function signOut(): Promise<void> {
  await clearProfileCookie();
  redirect("/comecar");
}

export async function updateLearningSettings(_: unknown, formData: FormData): Promise<ActionResult> {
  const p = await requireProfile();
  const goal = Number(formData.get("dailyGoal"));
  const freeMode = formData.get("freeMode") === "on";
  const name = String(formData.get("name") ?? p.name).trim();
  if (!Number.isInteger(goal) || goal < 1 || goal > 10) return { ok: false, error: "A meta tem de ser entre 1 e 10." };
  if (name.length < 2 || name.length > 40) return { ok: false, error: "Nome entre 2 e 40 letras." };
  await db.update(profiles).set({ dailyGoal: goal, freeMode, name }).where(eq(profiles.id, p.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------- missões ---------------- */

async function getMissionRow(profileId: string, missionId: string) {
  const rows = await db
    .select()
    .from(missionProgress)
    .where(and(eq(missionProgress.profileId, profileId), eq(missionProgress.missionId, missionId)))
    .limit(1);
  return rows[0];
}

async function upsertMission(profileId: string, missionId: string, patch: Partial<typeof missionProgress.$inferInsert>) {
  await db
    .insert(missionProgress)
    .values({ profileId, missionId, ...patch })
    .onConflictDoUpdate({
      target: [missionProgress.profileId, missionProgress.missionId],
      set: { ...patch, updatedAt: new Date() },
    });
}

function toggleIn(list: number[], i: number): { list: number[]; added: boolean } {
  const has = list.includes(i);
  return { list: has ? list.filter((x) => x !== i) : [...list, i].sort((a, b) => a - b), added: !has };
}

export async function toggleMissionItem(missionId: string, kind: "steps" | "proofs", index: number): Promise<ActionResult> {
  const p = await requireProfile();
  const lab = labById(missionId);
  const max = kind === "steps" ? lab?.steps.length : lab?.proofs.length;
  if (!lab || max === undefined || !Number.isInteger(index) || index < 0 || index >= max)
    return { ok: false, error: "Item inválido." };
  const row = await getMissionRow(p.id, missionId);
  const current = (row?.[kind] as number[] | undefined) ?? [];
  const { list, added } = toggleIn(current, index);
  await upsertMission(p.id, missionId, { [kind]: list });
  if (added) await logActivity(p.id, profileToday(p), kind === "steps" ? "step" : "proof", `${missionId}:${index}`);
  revalidatePath(`/missoes/${missionId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function saveMissionNotes(missionId: string, notes: string): Promise<ActionResult> {
  const p = await requireProfile();
  if (!labById(missionId)) return { ok: false, error: "Missão inválida." };
  await upsertMission(p.id, missionId, { notes: notes.slice(0, 5000) });
  return { ok: true };
}

export async function registerMissionRep(missionId: string, rating: number): Promise<ActionResult> {
  const p = await requireProfile();
  if (!labById(missionId) || !isRating(rating)) return { ok: false, error: "Pedido inválido." };
  const today = profileToday(p);
  const row = await getMissionRow(p.id, missionId);
  const prev = row
    ? { steps: row.steps, proofs: row.proofs, box: row.box, reps: row.reps, due: row.due, mastered: row.mastered, lastRep: row.lastRep }
    : emptyMission();
  const next = applyMissionRep(prev, rating, today);
  // uma repetição completa "limpa" a lista de passos para a próxima repetição
  await upsertMission(p.id, missionId, {
    box: next.box,
    reps: next.reps,
    due: next.due,
    mastered: next.mastered,
    lastRep: next.lastRep,
    steps: [],
  });
  await logActivity(p.id, today, "rep", missionId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markMissionMastered(missionId: string): Promise<ActionResult> {
  const p = await requireProfile();
  const lab = labById(missionId);
  if (!lab) return { ok: false, error: "Missão inválida." };
  const row = await getMissionRow(p.id, missionId);
  const ok = canMarkMastered({ proofsDone: row?.proofs.length ?? 0, proofsTotal: lab.proofs.length, box: row?.box ?? 0 });
  if (!ok) return { ok: false, error: "Ainda não: faltam provas ou repetições bem-sucedidas." };
  await upsertMission(p.id, missionId, { mastered: true });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------- cartas ---------------- */

export async function rateCard(key: string, rating: number): Promise<ActionResult> {
  const p = await requireProfile();
  if (!cardByKey(key) || !isRating(rating)) return { ok: false, error: "Pedido inválido." };
  const today = profileToday(p);
  const rows = await db
    .select()
    .from(cardProgress)
    .where(and(eq(cardProgress.profileId, p.id), eq(cardProgress.cardKey, key)))
    .limit(1);
  const prev = rows[0] ? { box: rows[0].box, due: rows[0].due, lapses: rows[0].lapses, reviews: rows[0].reviews } : newReviewState(today);
  const next = review(prev, rating, today);
  await db
    .insert(cardProgress)
    .values({ profileId: p.id, cardKey: key, ...next })
    .onConflictDoUpdate({ target: [cardProgress.profileId, cardProgress.cardKey], set: { ...next, updatedAt: new Date() } });
  await logActivity(p.id, today, "card", key);
  return { ok: true };
}

export async function finishCardSession(): Promise<void> {
  revalidatePath("/", "layout");
}

/* ---------------- testes ---------------- */

export type QuizResult = { ok: true; correct: number; total: number; pct: number; passed: boolean } | { ok: false; error: string };

export async function submitQuiz(level: number, answers: number[]): Promise<QuizResult> {
  const p = await requireProfile();
  const quiz = quizForLevel(level);
  if (!quiz || !Array.isArray(answers) || answers.length !== quiz.qs.length) return { ok: false, error: "Respostas incompletas." };
  const r = scoreQuiz(
    quiz.qs.map((q) => q.a),
    answers.map((a) => (Number.isInteger(a) ? a : -1)),
  );
  await db.insert(quizAttempts).values({ profileId: p.id, level, ...r });
  await logActivity(p.id, profileToday(p), "quiz", String(level));
  revalidatePath("/", "layout");
  return { ok: true, ...r };
}
