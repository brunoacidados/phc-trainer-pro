/**
 * Motor de repetição espaçada — versão corrigida.
 *
 * Base científica
 * - Efeito de espaçamento: Cepeda et al. (2006), Psychological Bulletin 132(3), meta-análise de 317 experiências.
 * - Sistema de caixas: Leitner (1972), "So lernt man lernen". Um item falhado volta à caixa inicial.
 * - A escada fixa [1,2,4,7,14,30,60] é uma APROXIMAÇÃO (previsível, fácil de explicar).
 *   Algoritmos adaptativos (SM-2 — Wozniak 1990; FSRS — Ye et al. 2022) estimam a curva de cada pessoa.
 *   Trade-off consciente: previsibilidade > otimização, porque previsibilidade reduz ansiedade (TDAH).
 *
 * Bugs do original corrigidos
 *  B3  "Errei" agendava +1 dia mas mantinha o contador → a resposta certa seguinte saltava para o
 *      intervalo longo. Agora um lapso volta à caixa 0 e conta como lapso.
 *  B7  (novo) Repetições de missão no MESMO dia avançavam a escada. Prática concentrada não é
 *      prática espaçada: repetir 5× numa tarde não prova retenção. Agora só avança se estiver vencida.
 */
import { addDays, type ISODate } from "./dates";

export const LADDER = [1, 2, 4, 7, 14, 30, 60] as const;
/** caixa a partir da qual uma carta conta como "dominada" (≈ 1 mês sem falhar) */
export const CARD_MASTERED_BOX = 5;

export function intervalForBox(box: number): number {
  if (box <= 0) return LADDER[0];
  return LADDER[Math.min(box - 1, LADDER.length - 1)];
}

/* ------------------------------------------------------------------ */
/* Cartas                                                              */
/* ------------------------------------------------------------------ */

export type Rating = 0 | 1 | 2; // 0 = não sabia · 1 = com esforço · 2 = sabia

export interface CardState {
  box: number;
  due: ISODate | null;
  lapses: number;
  reviews: number;
}

export const NEW_CARD: CardState = Object.freeze({ box: 0, due: null, lapses: 0, reviews: 0 });

export function reviewCard(prev: CardState, rating: Rating, today: ISODate): CardState {
  const reviews = prev.reviews + 1;
  if (rating === 0) {
    // Leitner: volta ao início. Revê amanhã (não hoje — evita loop frustrante na mesma sessão).
    return { box: 0, due: addDays(today, 1), lapses: prev.lapses + 1, reviews };
  }
  if (rating === 1) {
    // Com esforço: mantém a caixa e repete o MESMO intervalo (não sobe, não desce).
    return { box: prev.box, due: addDays(today, intervalForBox(prev.box)), lapses: prev.lapses, reviews };
  }
  const box = prev.box + 1;
  return { box, due: addDays(today, intervalForBox(box)), lapses: prev.lapses, reviews };
}

export function isCardDue(state: CardState | undefined, today: ISODate): boolean {
  if (!state || state.due === null) return false; // cartas novas não estão "vencidas": são "novas"
  return state.due <= today;
}

/* ------------------------------------------------------------------ */
/* Repetições de missão                                                */
/* ------------------------------------------------------------------ */

export interface RepState {
  reps: number;
  due: ISODate | null;
}

export type RepOutcome =
  | { advanced: true; state: RepState }
  | { advanced: false; state: RepState; reason: "not-due"; nextCounts: ISODate };

export function registerRep(prev: RepState, today: ISODate): RepOutcome {
  if (prev.due !== null && today < prev.due) {
    return { advanced: false, state: prev, reason: "not-due", nextCounts: prev.due };
  }
  const reps = prev.reps + 1;
  return { advanced: true, state: { reps, due: addDays(today, intervalForBox(reps)) } };
}
