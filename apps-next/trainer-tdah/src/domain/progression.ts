/**
 * Regras de progressão (funções puras sobre um "snapshot" do progresso).
 *
 * CORREÇÕES face ao original (packages/shared/src/srs.ts):
 *  - overallPct() devolvia 0 ou 1 (Math.round de uma fração ≤ 1) → a barra de
 *    "Progresso geral" mostrava 0% ou 1% para sempre. Aqui é 0–100.
 *  - currentBelt() tinha o teto 12 fixo no código, apesar de existirem 17 níveis.
 *  - Bloqueio rígido missão-a-missão substituído por: nível aberto → todas as
 *    missões acessíveis, UMA recomendada. Menos frustração, zero paralisia de escolha.
 */
import { BELTS, LABS, QUIZZES, labById, labsOfLevel } from "@/content";
import { addDays } from "./dates";
import { MISSION_MASTERY_BOX, type Rating, review } from "./srs";

export interface MissionState {
  steps: number[];
  proofs: number[];
  box: number;
  reps: number;
  due: string | null;
  mastered: boolean;
  lastRep: string | null;
}

export interface QuizState {
  best: number;
  passed: boolean;
  tries: number;
}

export interface Snapshot {
  missions: Record<string, MissionState>;
  cardsDue: number;
  cardsNew: number;
  cardsMastered: number;
  quizzes: Record<number, QuizState>;
  freeMode: boolean;
  today: string;
}

export const QUIZ_PASS_PCT = 80;
/** % de missões do nível anterior já praticadas para abrir o nível seguinte */
export const LEVEL_OPEN_RATIO = 0.5;

export function emptyMission(): MissionState {
  return { steps: [], proofs: [], box: 0, reps: 0, due: null, mastered: false, lastRep: null };
}

export function missionOf(s: Snapshot, id: string): MissionState {
  return s.missions[id] ?? emptyMission();
}

export function isStarted(m: MissionState): boolean {
  return m.reps > 0 || m.steps.length > 0 || m.proofs.length > 0;
}

/**
 * Regista uma repetição completa de uma missão.
 * Missões são tarefas de 30–90 min: repetir no mesmo dia não faz sentido,
 * por isso "precisei de ajuda" agenda para amanhã (em vez de hoje, como nas cartas).
 */
export function applyMissionRep(m: MissionState, rating: Rating, today: string): MissionState {
  const r = review({ box: m.box, due: m.due ?? today, lapses: 0, reviews: m.reps }, rating, today);
  const due = rating === 0 ? addDays(today, 1) : r.due;
  return {
    ...m,
    box: r.box,
    reps: m.reps + 1,
    due,
    lastRep: today,
    mastered: m.mastered || r.box >= MISSION_MASTERY_BOX,
  };
}

export interface LevelStatus {
  level: number;
  open: boolean;
  total: number;
  started: number;
  mastered: number;
  /** quantas missões do nível anterior faltam praticar para abrir */
  missingToOpen: number;
}

export function levelStatus(s: Snapshot, level: number): LevelStatus {
  const labs = labsOfLevel(level);
  const started = labs.filter((l) => missionOf(s, l.id).reps > 0).length;
  const mastered = labs.filter((l) => missionOf(s, l.id).mastered).length;
  let open = true;
  let missingToOpen = 0;
  if (!s.freeMode && level > 0) {
    const prev = labsOfLevel(level - 1);
    if (prev.length) {
      const need = Math.ceil(prev.length * LEVEL_OPEN_RATIO);
      const done = prev.filter((l) => missionOf(s, l.id).reps > 0).length;
      open = done >= need;
      missingToOpen = Math.max(0, need - done);
    }
  }
  return { level, open, total: labs.length, started, mastered, missingToOpen };
}

export function missionAccessible(s: Snapshot, id: string): boolean {
  const lab = labById(id);
  if (!lab) return false;
  if (missionOf(s, id).reps > 0) return true;
  return levelStatus(s, lab.lv).open;
}

/** Nível atual = primeiro nível ainda não concluído (todas dominadas + teste aprovado). */
export function currentBelt(s: Snapshot): number {
  for (let lv = 0; lv < BELTS.length; lv++) {
    const labs = labsOfLevel(lv);
    const allMastered = labs.every((l) => missionOf(s, l.id).mastered);
    const passed = s.quizzes[lv]?.passed ?? false;
    if (!(allMastered && passed)) return lv;
  }
  return BELTS.length - 1;
}

export function labsMastered(s: Snapshot): number {
  return LABS.filter((l) => missionOf(s, l.id).mastered).length;
}

export function quizzesPassed(s: Snapshot): number {
  return QUIZZES.filter((q) => s.quizzes[q.lv]?.passed).length;
}

/** Domínio global 0–100: missões 70% + testes 20% + cartas 10% (mesmos pesos do original). */
export function overallPct(s: Snapshot, totalCards: number): number {
  const m = LABS.length ? labsMastered(s) / LABS.length : 0;
  const q = QUIZZES.length ? quizzesPassed(s) / QUIZZES.length : 0;
  const c = totalCards ? s.cardsMastered / totalCards : 0;
  return Math.round((m * 0.7 + q * 0.2 + c * 0.1) * 100);
}

export function dueMissions(s: Snapshot): string[] {
  return LABS.filter((l) => {
    const m = s.missions[l.id];
    return m && !m.mastered && m.due !== null && m.due <= s.today;
  }).map((l) => l.id);
}

/** Missão recomendada: a primeira acessível ainda sem repetições, pela ordem do curso. */
export function recommendedMission(s: Snapshot): string | null {
  for (const l of LABS) {
    if (missionOf(s, l.id).reps === 0 && missionAccessible(s, l.id)) return l.id;
  }
  return null;
}

export type NextAction =
  | { kind: "resume"; missionId: string }
  | { kind: "review-mission"; missionId: string; more: number }
  | { kind: "cards"; count: number }
  | { kind: "mission"; missionId: string }
  | { kind: "all-done" };

/**
 * UMA próxima ação. Prioridade:
 *  1. Retomar missão começada e não terminada (acabar o que se começou reduz a
 *     "tarefa aberta" que ocupa memória de trabalho — efeito Zeigarnik).
 *  2. Revisões de missões vencidas (o esquecimento não espera).
 *  3. Cartas vencidas.
 *  4. Próxima missão nova.
 */
export function nextAction(s: Snapshot): NextAction {
  const resume = LABS.find((l) => {
    const m = s.missions[l.id];
    return m && m.reps === 0 && (m.steps.length > 0 || m.proofs.length > 0);
  });
  if (resume) return { kind: "resume", missionId: resume.id };
  const due = dueMissions(s);
  if (due.length) return { kind: "review-mission", missionId: due[0], more: due.length - 1 };
  if (s.cardsDue > 0) return { kind: "cards", count: s.cardsDue };
  const rec = recommendedMission(s);
  if (rec) return { kind: "mission", missionId: rec };
  return { kind: "all-done" };
}

/** Pontuação de teste calculada no servidor (não se confia no cliente). */
export function scoreQuiz(correctIdx: number[], answers: number[]): { correct: number; total: number; pct: number; passed: boolean } {
  const total = correctIdx.length;
  const correct = correctIdx.filter((a, i) => answers[i] === a).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, pct, passed: pct >= QUIZ_PASS_PCT };
}
