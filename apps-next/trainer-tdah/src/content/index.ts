/**
 * Acesso ao conteúdo estático. Fonte de verdade: ./data/*.json
 * (cópia de packages/content do repositório original + errata em scripts/apply-errata.mjs).
 * Tudo aqui é puro e síncrono — pode ser usado em Server e Client Components.
 */
import beltsJson from "./data/belts.json";
import cardsJson from "./data/cards.json";
import glossaryJson from "./data/glossary.json";
import labsJson from "./data/labs.json";
import quizzesJson from "./data/quizzes.json";
import theoryJson from "./data/theory.json";
import { CODE_EXAMPLES } from "./examples";
import type { Belt, CodeExample, FlashCard, GlossaryTerm, Lab, MissionTheory, Quiz } from "./types";

export const BELTS = beltsJson as Belt[];
export const LABS = labsJson as Lab[];
export const CARDS = cardsJson as FlashCard[];
export const QUIZZES = quizzesJson as Quiz[];
export const GLOSSARY = glossaryJson as GlossaryTerm[];
const THEORY = theoryJson as unknown as Record<string, MissionTheory>;

const labIndex = new Map(LABS.map((l) => [l.id, l]));

export function labById(id: string): Lab | undefined {
  return labIndex.get(id);
}

export function theoryFor(id: string): MissionTheory | undefined {
  return THEORY[id];
}

export function labsOfLevel(level: number): Lab[] {
  return LABS.filter((l) => l.lv === level);
}

export function beltName(level: number): string {
  return BELTS[level]?.name ?? `Nível ${level}`;
}

export function quizForLevel(level: number): Quiz | undefined {
  return QUIZZES.find((q) => q.lv === level);
}

export function examplesForMission(id: string): CodeExample[] {
  return CODE_EXAMPLES.filter((e) => e.missions.includes(id));
}

export function exampleById(id: string): CodeExample | undefined {
  return CODE_EXAMPLES.find((e) => e.id === id);
}

/**
 * Chave estável de uma carta = hash do texto da frente.
 * CORREÇÃO face ao original: lá o progresso era guardado pelo ÍNDICE da carta
 * no array, pelo que inserir cartas no meio (ex.: +25 cartas nível 9) desalinhava
 * o progresso de todos os alunos.
 */
export function cardKey(card: FlashCard): string {
  let h = 5381;
  const s = card.t.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `c${h.toString(36)}`;
}

const cardIndex = new Map(CARDS.map((c) => [cardKey(c), c]));
export function cardByKey(key: string): FlashCard | undefined {
  return cardIndex.get(key);
}

export { CODE_EXAMPLES };
export type * from "./types";
