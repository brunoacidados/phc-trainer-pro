/**
 * Tipos do conteúdo pedagógico (herdado do repositório original, com errata aplicada).
 * Os nomes curtos das chaves JSON (t, lv, c, s, e…) vêm do formato legado;
 * aqui são mapeados para nomes legíveis antes de chegar à UI.
 */

export interface RawProof {
  d: string;
  k: string;
}
export interface RawAsk {
  q: string;
  a: string;
}
export interface RawLink {
  k: string;
  t: string;
  u: string;
}
export interface RawLab {
  id: string;
  t: string;
  lv: number;
  min: number;
  meta: string;
  pre: string[];
  ref: string;
  goal: string;
  steps: string[];
  proofs: RawProof[];
  proofs2?: RawProof[];
  ask: RawAsk[];
  links?: RawLink[];
}
export interface RawTheory {
  c: string;
  s: [string, string][];
  e: string[];
}
export interface RawQuizQuestion {
  q: string;
  o: string[];
  a: number;
  why: string;
}
export interface RawQuiz {
  lv: number;
  nome: string;
  qs: RawQuizQuestion[];
}
export interface RawCard {
  t: string;
  b: string;
  lv: number;
}
export interface RawBelt {
  n: number;
  name: string;
  cor: string;
  desc: string;
}
export interface RawGlossary {
  t: string;
  d: string;
  tag: string;
  x?: string;
}

/* ---------- modelos limpos usados pela app ---------- */

export interface Mission {
  id: string;
  title: string;
  level: number;
  minutes: number;
  /** metade da duração, em linguagem humana ("30 min") — usada como "tempo de repetição" */
  repTime: string;
  prerequisites: string[];
  guideRef: string;
  goal: string;
  steps: string[];
  proofs: { text: string; kind: string }[];
  questions: { q: string; a: string }[];
  links: { kind: string; title: string; url: string }[];
  theory: {
    /** conceito partido em frases curtas (chunking) */
    sentences: string[];
    terms: { term: string; def: string }[];
    pitfalls: string[];
  };
}

export interface Level {
  n: number;
  name: string;
  color: string;
  description: string;
}

export interface Card {
  /** id estável (hash de nível + pergunta) — NÃO depende da posição no array */
  id: string;
  front: string;
  back: string;
  level: number;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}
export interface Quiz {
  level: number;
  name: string;
  questions: QuizQuestion[];
}

export interface GlossaryEntry {
  term: string;
  def: string;
  tag: string;
  extra?: string;
}
