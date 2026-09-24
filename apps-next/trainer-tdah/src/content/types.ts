/**
 * Tipos do conteúdo pedagógico (portados de @phc/content do repositório original).
 * Os nomes curtos (t, lv, d…) vêm do formato legado; os acessores em ./index.ts
 * expõem nomes descritivos para o resto da aplicação.
 */

export interface Belt {
  n: number;
  name: string;
  cor: string;
  desc: string;
}

export interface LabProof {
  d: string;
  k: string;
}

export interface LabAsk {
  q: string;
  a: string;
}

export interface MissionLink {
  k: "manual" | "video" | "doc" | "legal" | "canal";
  t: string;
  u: string;
}

export interface Lab {
  id: string;
  t: string;
  lv: number;
  min: number;
  meta: string;
  pre: string[];
  ref: string;
  goal: string;
  steps: string[];
  proofs: LabProof[];
  ask: LabAsk[];
  links?: MissionLink[];
}

export interface MissionTheory {
  /** conceito (parágrafo de abertura) */
  c: string;
  /** conceitos-chave [título, descrição] */
  s: [string, string][];
  /** erros comuns */
  e: string[];
}

export interface FlashCard {
  t: string;
  b: string;
  lv: number;
  tag?: string;
}

export interface QuizQuestion {
  q: string;
  o: string[];
  a: number;
  why: string;
}

export interface Quiz {
  lv: number;
  nome: string;
  qs: QuizQuestion[];
}

export interface GlossaryTerm {
  t: string;
  d: string;
  tag?: string;
  pratica?: string;
}

/** Exemplo prático de código: problema → versão frágil → versão correta → como verificar. */
export interface CodeExample {
  id: string;
  title: string;
  /** missões onde o exemplo é aplicado */
  missions: string[];
  language: "sql" | "xbase";
  problem: string;
  bad: { code: string; why: string[] };
  good: { code: string; why: string[] };
  verify: string[];
  sources: { label: string; url: string }[];
  /** aviso de validação (quando depende da versão/instalação do PHC) */
  caveat?: string;
}
