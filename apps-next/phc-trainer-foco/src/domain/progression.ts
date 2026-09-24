/**
 * Regras de progressão e "próxima ação". Funções puras: recebem conteúdo + progresso, devolvem decisões.
 * Nenhuma dependência de BD ou React → 100% testável.
 */
import type { ISODate } from "./dates";
import { CARD_MASTERED_BOX, type CardState } from "./srs";

export interface MissionLike {
  id: string;
  level: number;
  title: string;
  steps: unknown[];
  proofs: unknown[];
}

export interface MissionProgress {
  steps: number[]; // índices dos passos concluídos
  proofs: number[]; // índices das provas confirmadas
  reps: number;
  due: ISODate | null;
  mastered: boolean;
}

export const EMPTY_MISSION: MissionProgress = Object.freeze({ steps: [], proofs: [], reps: 0, due: null, mastered: false }) as MissionProgress;

/** repetições espaçadas mínimas para poder declarar domínio */
export const MIN_REPS_FOR_MASTERY = 2;
export const QUIZ_PASS_PCT = 80;
/** micro-ações por dia. 3 (não 5 como no original): meta pequena = começar é fácil (Locke & Latham, 2002; Fogg, 2019) */
export const DAILY_GOAL = 3;
/** máximo de cartas por sessão: sessões curtas e com fim à vista */
export const CARD_SESSION_SIZE = 10;

export type MissionStatus = "nova" | "em-curso" | "a-rever" | "dominada";

export function missionStatus(p: MissionProgress | undefined, today: ISODate): MissionStatus {
  if (!p) return "nova";
  if (p.mastered) return "dominada";
  if (p.reps > 0 && p.due !== null && p.due <= today) return "a-rever";
  if (p.steps.length || p.proofs.length || p.reps) return "em-curso";
  return "nova";
}

/**
 * B4 corrigido: no original "Sei de cor" não exigia nada — contradizendo a própria missão L00
 * ("marcar feito sem prova = sensação de progresso sem competência").
 * Bjork, Dunlosky & Kornell (2013): julgamentos de aprendizagem sem teste são sistematicamente otimistas.
 */
export function masteryBlockers(m: MissionLike, p: MissionProgress | undefined): string[] {
  const out: string[] = [];
  const proofsDone = p?.proofs.length ?? 0;
  const reps = p?.reps ?? 0;
  if (proofsDone < m.proofs.length) out.push(`Confirmar as provas (${proofsDone}/${m.proofs.length})`);
  if (reps < MIN_REPS_FOR_MASTERY)
    out.push(`Fazer ${MIN_REPS_FOR_MASTERY} repetições em dias diferentes (${reps}/${MIN_REPS_FOR_MASTERY})`);
  return out;
}

export function canMarkMastered(m: MissionLike, p: MissionProgress | undefined): boolean {
  return masteryBlockers(m, p).length === 0;
}

/** fração de passos+provas feitos (0..1) — dá micro-progresso visível dentro da missão */
export function missionCompletion(m: MissionLike, p: MissionProgress | undefined): number {
  const total = m.steps.length + m.proofs.length;
  if (!total || !p) return p?.mastered ? 1 : 0;
  if (p.mastered) return 1;
  return Math.min(1, (p.steps.length + p.proofs.length) / total);
}

/* ------------------------------------------------------------------ */
/* Progresso global                                                    */
/* ------------------------------------------------------------------ */

export interface ProgressSnapshot {
  missions: Record<string, MissionProgress>;
  cards: Record<string, CardState>;
  quizzesPassed: Set<number>;
}

/**
 * B1 corrigido: o original fazia Math.round(fração ≤ 1) → devolvia sempre 0 ou 1.
 * Pesos mantidos (70% missões, 20% testes, 10% cartas) mas agora em percentagem real.
 */
export function overallPct(
  s: ProgressSnapshot,
  totals: { missions: number; quizzes: number; cards: number },
): number {
  const mastered = Object.values(s.missions).filter((m) => m.mastered).length;
  const cardsMastered = Object.values(s.cards).filter((c) => c.box >= CARD_MASTERED_BOX).length;
  const frac =
    (totals.missions ? mastered / totals.missions : 0) * 0.7 +
    (totals.quizzes ? s.quizzesPassed.size / totals.quizzes : 0) * 0.2 +
    (totals.cards ? cardsMastered / totals.cards : 0) * 0.1;
  return Math.round(frac * 100);
}

export function levelComplete(level: number, missions: MissionLike[], s: ProgressSnapshot): boolean {
  const ofLevel = missions.filter((m) => m.level === level);
  return ofLevel.every((m) => s.missions[m.id]?.mastered) && s.quizzesPassed.has(level);
}

/**
 * B2 corrigido: o original limitava a 12 (`Math.min(lv + 1, 12)`) apesar de existirem 17 níveis.
 * Devolve o número de níveis concluídos consecutivamente desde o 0.
 */
export function levelsCompleted(levelCount: number, missions: MissionLike[], s: ProgressSnapshot): number {
  let n = 0;
  for (let lv = 0; lv < levelCount; lv++) {
    if (levelComplete(lv, missions, s)) n = lv + 1;
    else break;
  }
  return n;
}

/* ------------------------------------------------------------------ */
/* Próxima ação — o coração da UX para TDAH                            */
/* ------------------------------------------------------------------ */

export type NextAction =
  | { kind: "continuar-missao"; missionId: string; title: string; reason: string }
  | { kind: "rever-cartas"; count: number; reason: string }
  | { kind: "repetir-missao"; missionId: string; title: string; reason: string }
  | { kind: "nova-missao"; missionId: string; title: string; reason: string }
  | { kind: "tudo-feito"; reason: string };

/**
 * Escolhe UMA ação. Ordem justificada:
 *  1. Missão a meio      → terminar o que começou (efeito Zeigarnik; menor custo de arranque, contexto já carregado)
 *  2. Cartas vencidas    → 3–5 min, vitória rápida, e adiar custa retenção
 *  3. Repetição vencida  → prática espaçada da missão
 *  4. Missão nova        → só quando não há dívida de revisão
 * O aluno pode sempre escolher outra (ver `alternatives`) — autonomia importa (Ryan & Deci, 2000).
 */
export function nextAction(
  missions: MissionLike[],
  s: ProgressSnapshot,
  dueCardCount: number,
  today: ISODate,
): NextAction {
  const inProgress = missions.find((m) => missionStatus(s.missions[m.id], today) === "em-curso" && (s.missions[m.id]?.reps ?? 0) === 0);
  if (inProgress)
    return {
      kind: "continuar-missao",
      missionId: inProgress.id,
      title: inProgress.title,
      reason: "Já começou esta missão. Terminar o que está a meio custa menos do que começar algo novo.",
    };
  if (dueCardCount > 0)
    return {
      kind: "rever-cartas",
      count: Math.min(dueCardCount, CARD_SESSION_SIZE),
      reason: "Tem cartas prontas a rever. Leva poucos minutos e é o que mais protege a memória.",
    };
  const toRepeat = missions.find((m) => missionStatus(s.missions[m.id], today) === "a-rever");
  if (toRepeat)
    return {
      kind: "repetir-missao",
      missionId: toRepeat.id,
      title: toRepeat.title,
      reason: "Chegou o dia de repetir esta missão. Repetir espaçado é o que fixa o procedimento.",
    };
  const fresh = missions.find((m) => missionStatus(s.missions[m.id], today) === "nova");
  if (fresh)
    return {
      kind: "nova-missao",
      missionId: fresh.id,
      title: fresh.title,
      reason: "Não há revisões pendentes. É um bom momento para aprender algo novo.",
    };
  return { kind: "tudo-feito", reason: "Não há nada pendente hoje. Descansar também faz parte do método." };
}

/** dias ativos nos últimos 7 — substitui o "streak" que parte ao falhar um dia (gera vergonha e abandono) */
export function activeDaysInLastWeek(days: ISODate[], today: ISODate, addDaysFn: (d: ISODate, n: number) => ISODate): number {
  const from = addDaysFn(today, -6);
  return new Set(days.filter((d) => d >= from && d <= today)).size;
}

/* ------------------------------------------------------------------ */
/* Testes de nível — pontuação SEMPRE no servidor                      */
/* ------------------------------------------------------------------ */

/** B6 corrigido: o original recebia `pct` calculado no cliente. */
export function scoreQuiz(answerKey: number[], answers: number[]): { correct: number; total: number; pct: number; passed: boolean } {
  const total = answerKey.length;
  let correct = 0;
  for (let i = 0; i < total; i++) if (answers[i] === answerKey[i]) correct++;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, pct, passed: pct >= QUIZ_PASS_PCT };
}
