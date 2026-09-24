/**
 * Motor de repetição espaçada (SRS) e regras de progressão —
 * portado fielmente do app legado (rep/rateCard/beltUnlocked/levelOpen/missionUnlocked).
 */
import { BELTS, LABS, PROMPTS, QUIZZES, CARDS, labById } from "@phc/content";
import type { CardState, LabState, PlanState, ProgressState } from "./types.ts";
import { addDays, todayISO } from "./date.ts";

export const LADDER: number[] = PROMPTS.ladder; // [1,2,4,7,14,30,60]
export const REP_TARGET: number = PROMPTS.repTarget; // 5
export const CARD_TARGET: number = PROMPTS.cardTarget; // 5

export function emptyLabState(): LabState {
  return { c: 0, due: null, mem: false, steps: {}, proofs: {}, hist: [] };
}

export function emptyCardState(): CardState {
  return { c: 0, due: null };
}

export function labSt(s: ProgressState, id: string): LabState {
  if (!s.labs[id]) s.labs[id] = emptyLabState();
  return s.labs[id];
}

export function cardSt(s: ProgressState, idx: number | string): CardState {
  const k = String(idx);
  if (!s.cards[k]) s.cards[k] = emptyCardState();
  return s.cards[k];
}

/** próxima revisão de uma missão após a repetição nº `c` (já incrementado) */
export function nextLabDue(c: number, today = todayISO()): string {
  return addDays(today, LADDER[Math.min(c - 1, LADDER.length - 1)]);
}

/* ---------- mutações (puras sobre o estado; quem persiste é a camada de cima) ---------- */

export function touchStreak(s: ProgressState, today = todayISO()): void {
  if (s.streak.last === today) return;
  s.streak.n = s.streak.last === addDays(today, -1) ? s.streak.n + 1 : 1;
  s.streak.last = today;
}

export function bumpDaily(
  s: ProgressState,
  kind: "reps" | "cards" | "proofs" | "lessons",
  today = todayISO(),
): void {
  if (!s.daily || s.daily.d !== today)
    s.daily = { d: today, reps: 0, cards: 0, proofs: 0, lessons: 0 };
  s.daily[kind] = (s.daily[kind] || 0) + 1;
}

/** regista uma repetição de missão (botão "✅ Registar repetição") */
export function registerLabRep(s: ProgressState, id: string, today = todayISO()): LabState {
  const st = labSt(s, id);
  st.c++;
  st.hist.push(today);
  st.due = nextLabDue(st.c, today);
  touchStreak(s, today);
  bumpDaily(s, "reps", today);
  return st;
}

export function markLabMastered(s: ProgressState, id: string, today = todayISO()): void {
  labSt(s, id).mem = true;
  touchStreak(s, today);
}

export function toggleStep(s: ProgressState, id: string, i: number): void {
  const st = labSt(s, id);
  const k = String(i);
  st.steps[k] = !st.steps[k];
}

export function toggleProof(s: ProgressState, id: string, i: number, today = todayISO()): void {
  const st = labSt(s, id);
  const k = String(i);
  st.proofs[k] = !st.proofs[k];
  if (st.proofs[k]) {
    touchStreak(s, today);
    bumpDaily(s, "proofs", today);
  }
}

/** avalia um flashcard: 0=errei (+1d), 1=quase (+2d), 2=sabia (sobe na escada) */
export function rateCard(
  s: ProgressState,
  idx: number | string,
  q: 0 | 1 | 2,
  today = todayISO(),
): void {
  const c = cardSt(s, idx);
  if (q === 0) {
    // FIX: lapso volta à 1ª caixa (Leitner/SM-2); antes mantinha o contador
    c.c = 0;
    c.due = addDays(today, 1);
  }
  else if (q === 1) c.due = addDays(today, 2);
  else {
    c.c++;
    c.due = addDays(today, LADDER[Math.min(c.c - 1, LADDER.length - 1)]);
  }
  touchStreak(s, today);
  bumpDaily(s, "cards", today);
}

/** submete um teste de nível (pct 0-100; aprovação ≥80) */
export function submitQuiz(s: ProgressState, lv: number, pct: number, today = todayISO()): void {
  const k = String(lv);
  const prev = s.quiz[k] || { best: 0, passed: false, tries: 0 };
  s.quiz[k] = {
    best: Math.max(prev.best, pct),
    passed: prev.passed || pct >= 80,
    tries: prev.tries + 1,
  };
  touchStreak(s, today);
}

/* ---------- seletores ---------- */

export function totalReps(s: ProgressState): number {
  let n = 0;
  for (const k in s.labs) n += s.labs[k].c;
  return n;
}

export function labsMastered(s: ProgressState): number {
  return LABS.filter((l) => s.labs[l.id]?.mem).length;
}

export function cardsMastered(s: ProgressState): number {
  let n = 0;
  for (const k in s.cards) if (s.cards[k].c >= CARD_TARGET) n++;
  return n;
}

export function quizzesPassed(s: ProgressState): number {
  let n = 0;
  for (let lv = 0; lv < QUIZZES.length; lv++) if (s.quiz[String(lv)]?.passed) n++;
  return n;
}

export function xpTotal(s: ProgressState): number {
  return (
    totalReps(s) * 10 +
    labsMastered(s) * 100 +
    quizzesPassed(s) * 50 +
    (s.stats.lessons || 0) * 5 +
    (s.stats.chats || 0) * 2 +
    s.evid.length * 2 +
    cardsMastered(s) * 3
  );
}

export function overallPct(s: ProgressState): number {
  // FIX: devolvia 0 ou 1 (Math.round de uma fração ≤ 1) — agora 0–100
  return Math.round(
    ((labsMastered(s) / LABS.length) * 0.7 +
      (quizzesPassed(s) / QUIZZES.length) * 0.2 +
      (cardsMastered(s) / CARDS.length) * 0.1) *
      100,
  );
}

export function beltUnlocked(s: ProgressState, lv: number): boolean {
  const labs = LABS.filter((l) => l.lv === lv);
  for (const l of labs) {
    if (!s.labs[l.id]?.mem) return false;
  }
  return !!s.quiz[String(lv)]?.passed;
}

export function currentBelt(s: ProgressState): number {
  let b = 0;
  for (let lv = 0; lv < BELTS.length; lv++) {
    if (beltUnlocked(s, lv)) b = Math.min(lv + 1, BELTS.length - 1) // FIX: teto era 12 fixo (há 17 níveis);
    else break;
  }
  return b;
}

export function levelOpen(s: ProgressState, lv: number): boolean {
  if (s.settings.freeMode) return true;
  if (lv <= 0) return true;
  const prev = LABS.filter((l) => l.lv === lv - 1);
  if (!prev.length) return true;
  const done = prev.filter((l) => (s.labs[l.id]?.c ?? 0) > 0).length;
  return done >= Math.ceil(prev.length * 0.5);
}

/** ordem das missões: plano personalizado primeiro, restantes por defeito */
export function journeyPath(plan: PlanState | null): string[] {
  const base = plan?.ordem?.length ? [...plan.ordem] : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of base) {
    if (!seen.has(id) && labById(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const l of LABS) {
    if (!seen.has(l.id)) {
      seen.add(l.id);
      out.push(l.id);
    }
  }
  return out;
}

export function missionUnlocked(s: ProgressState, id: string): boolean {
  if (s.settings.freeMode) return true;
  const st = s.labs[id];
  if (st && st.c > 0) return true;
  const lab = labById(id);
  if (!lab) return false;
  if (!levelOpen(s, lab.lv)) return false;
  const path = journeyPath(s.plan).filter((x) => labById(x)?.lv === lab.lv);
  const i = path.indexOf(id);
  if (i <= 0) return true;
  const ps = s.labs[path[i - 1]];
  return !!(ps && ps.c > 0);
}

/** missões com revisão vencida (não dominadas) */
export function dueLabs(s: ProgressState, today = todayISO()): string[] {
  const out: string[] = [];
  for (const l of LABS) {
    const st = s.labs[l.id];
    if (st && !st.mem && st.due && st.due <= today) out.push(l.id);
  }
  return out;
}

export function dueCardsN(s: ProgressState, today = todayISO()): number {
  let n = 0;
  for (let i = 0; i < CARDS.length; i++) {
    const c = s.cards[String(i)];
    if (c && c.due && c.due <= today && c.c < CARD_TARGET) n++;
  }
  return n;
}

export function newCardsN(s: ProgressState): number {
  let n = 0;
  for (let i = 0; i < CARDS.length; i++) if (!s.cards[String(i)]) n++;
  return n;
}

/** primeira missão desbloqueada e não dominada, na ordem da jornada */
export function currentMission(s: ProgressState): string | null {
  for (const id of journeyPath(s.plan)) {
    const st = s.labs[id];
    if (missionUnlocked(s, id) && !(st && (st.mem || st.c > 0))) return id;
  }
  for (const id of journeyPath(s.plan)) {
    const st = s.labs[id];
    if (missionUnlocked(s, id) && st && !st.mem && st.c > 0) return id;
  }
  return null;
}

export function dailyToday(s: ProgressState, today = todayISO()) {
  return s.daily && s.daily.d === today
    ? s.daily
    : { d: today, reps: 0, cards: 0, proofs: 0, lessons: 0 };
}

/** meta diária: 5 ações (reps + cartas + provas + aulas) */
export const DAILY_GOAL = 5;

export function dailyActions(s: ProgressState, today = todayISO()): number {
  const d = dailyToday(s, today);
  return (d.reps || 0) + (d.cards || 0) + (d.proofs || 0) + (d.lessons || 0);
}
