/**
 * Motor de repetição espaçada (SRS) — sistema de Leitner com escada de intervalos.
 *
 * Mantém a escada do original [1,2,4,7,14,30,60] dias (continuidade para os alunos),
 * mas CORRIGE três problemas conceptuais:
 *
 * 1. LAPSO NÃO REINICIAVA: no original, "errei" agendava +1 dia mas mantinha o contador;
 *    à resposta certa seguinte a carta saltava logo para um intervalo longo. No sistema
 *    de Leitner (Leitner, 1972) e no SM-2 (Wozniak, 1990) uma falha devolve o item à
 *    primeira caixa. Aqui: "Errei" → caixa 0 e volta ainda HOJE (reaprendizagem).
 * 2. "QUASE" NÃO TINHA EFEITO CONSISTENTE: agora mantém a caixa e usa metade do intervalo.
 * 3. DOMÍNIO AUTO-DECLARADO: o original permitia "sei de cor" sem provas — o próprio
 *    conteúdo avisava contra "sensação de progresso sem competência". Aqui o domínio
 *    exige provas completas + repetições bem-sucedidas (ver canMarkMastered).
 *
 * Nota honesta: uma escada fixa NÃO é "rever no momento exato em que está quase a
 * esquecer" (isso exige algoritmos adaptativos como o FSRS). É uma aproximação simples,
 * previsível e comprovadamente melhor do que estudo em bloco (Cepeda et al., 2006).
 */

import { addDays } from "./dates";

export const LADDER = [1, 2, 4, 7, 14, 30, 60] as const;
/** Caixa a partir da qual uma carta conta como dominada (intervalo ≥ 14 dias). */
export const CARD_MASTERY_BOX = 5;
/** Repetições bem-sucedidas para uma missão ficar dominada automaticamente. */
export const MISSION_MASTERY_BOX = 5;
/** Mínimo de repetições bem-sucedidas para permitir marcar "dominada" manualmente. */
export const MIN_BOX_FOR_MANUAL_MASTERY = 2;

/** 0 = Errei / precisei de ajuda · 1 = Com esforço · 2 = Fácil */
export type Rating = 0 | 1 | 2;

export interface ReviewState {
  /** caixa de Leitner (0 = nova/reaprender) */
  box: number;
  /** próxima revisão (ISO) */
  due: string;
  lapses: number;
  reviews: number;
}

export function intervalForBox(box: number): number {
  const i = Math.max(0, Math.min(box, LADDER.length - 1));
  return LADDER[i];
}

export function newReviewState(today: string): ReviewState {
  return { box: 0, due: today, lapses: 0, reviews: 0 };
}

/**
 * Aplica uma avaliação. Função PURA: devolve um novo estado.
 *  - Errei (0): caixa → 0, lapsos +1, volta HOJE (a sessão mostra-a outra vez).
 *  - Com esforço (1): caixa mantém-se, intervalo = metade (mín. 1 dia).
 *  - Fácil (2): intervalo da caixa atual, depois sobe uma caixa.
 */
export function review(prev: ReviewState, rating: Rating, today: string): ReviewState {
  const reviews = prev.reviews + 1;
  if (rating === 0) {
    return { box: 0, due: today, lapses: prev.lapses + 1, reviews };
  }
  if (rating === 1) {
    const days = Math.max(1, Math.floor(intervalForBox(prev.box) / 2));
    return { box: prev.box, due: addDays(today, days), lapses: prev.lapses, reviews };
  }
  return {
    box: Math.min(prev.box + 1, LADDER.length),
    due: addDays(today, intervalForBox(prev.box)),
    lapses: prev.lapses,
    reviews,
  };
}

export function isDue(state: Pick<ReviewState, "due">, today: string): boolean {
  return state.due <= today;
}

export function isCardMastered(state: Pick<ReviewState, "box">): boolean {
  return state.box >= CARD_MASTERY_BOX;
}

/**
 * Pode marcar a missão como dominada? Exige evidência objetiva:
 * todas as provas feitas + pelo menos MIN_BOX_FOR_MANUAL_MASTERY repetições bem-sucedidas.
 */
export function canMarkMastered(input: { proofsDone: number; proofsTotal: number; box: number }): boolean {
  return input.proofsDone >= input.proofsTotal && input.box >= MIN_BOX_FOR_MANUAL_MASTERY;
}

/**
 * Seleciona a sessão de cartas: primeiro as vencidas (mais atrasadas primeiro),
 * depois até `maxNew` cartas novas. Sessões curtas (predefinição 10) reduzem a
 * barreira de arranque — crítico com TDAH ("só 10 cartas" é fácil de começar).
 */
export function pickSession<K extends string>(
  keysInOrder: K[],
  states: Partial<Record<K, ReviewState>>,
  today: string,
  opts: { size?: number; maxNew?: number } = {},
): K[] {
  const size = opts.size ?? 10;
  const maxNew = opts.maxNew ?? 5;
  const due = keysInOrder
    .filter((k) => {
      const s = states[k];
      return s && !isCardMastered(s) && isDue(s, today);
    })
    .sort((a, b) => (states[a]!.due < states[b]!.due ? -1 : states[a]!.due > states[b]!.due ? 1 : 0));
  const fresh = keysInOrder.filter((k) => !states[k]).slice(0, maxNew);
  return [...due, ...fresh].slice(0, size);
}
