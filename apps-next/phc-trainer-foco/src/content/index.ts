/**
 * Ponto único de acesso ao conteúdo. Só deve ser importado por código de servidor
 * (Server Components, Server Actions, testes) — os JSON têm ~450 KB e não devem
 * ir para o bundle do browser. Componentes cliente recebem apenas o que precisam via props.
 */
import labsJson from "./data/labs.json";
import theoryJson from "./data/theory.json";
import quizzesJson from "./data/quizzes.json";
import cardsJson from "./data/cards.json";
import beltsJson from "./data/belts.json";
import glossaryJson from "./data/glossary.json";
import type {
  Card,
  GlossaryEntry,
  Level,
  Mission,
  Quiz,
  RawBelt,
  RawCard,
  RawGlossary,
  RawLab,
  RawQuiz,
  RawTheory,
} from "./types";

export * from "./types";

/**
 * FNV-1a 32-bit. Simples, determinístico e sem dependências.
 * Usado para gerar ids estáveis de cartas a partir do texto.
 */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Parte um parágrafo em frases, respeitando abreviaturas frequentes no conteúdo
 * ("ex.", "p.ex.", "art.", "n.º") para não cortar a meio.
 * Motivo (TDAH): parágrafos de 5–8 frases densas são difíceis de manter na memória
 * de trabalho; frases isoladas, uma por linha, permitem leitura em "pedaços".
 */
export function splitSentences(text: string): string[] {
  const protectedText = text.replace(/\b(ex|p\.ex|art|n\.º|nº|Cap|cf|vs|etc)\.\s/gi, (m) => m.replace(". ", ".\u0000"));
  return protectedText
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"'(“<])/u)
    .map((s) => s.replace(/\u0000/g, " ").trim())
    .filter(Boolean);
}

const theory = theoryJson as unknown as Record<string, RawTheory>;

function toMission(l: RawLab): Mission {
  const th = theory[l.id];
  return {
    id: l.id,
    title: l.t,
    level: l.lv,
    minutes: l.min,
    repTime: l.meta,
    prerequisites: l.pre,
    guideRef: l.ref,
    goal: l.goal,
    steps: l.steps,
    proofs: [...l.proofs, ...(l.proofs2 ?? [])].map((p) => ({ text: p.d, kind: p.k })),
    questions: l.ask,
    links: (l.links ?? []).map((x) => ({ kind: x.k, title: x.t, url: x.u })),
    theory: {
      sentences: th ? splitSentences(th.c) : [],
      terms: th ? th.s.map(([term, def]) => ({ term, def })) : [],
      pitfalls: th ? th.e : [],
    },
  };
}

export const MISSIONS: Mission[] = (labsJson as unknown as RawLab[]).map(toMission);
const missionIndex = new Map(MISSIONS.map((m, i) => [m.id, i]));

export const LEVELS: Level[] = (beltsJson as RawBelt[]).map((b) => ({
  n: b.n,
  name: b.name,
  color: b.cor,
  description: b.desc,
}));

export const CARDS: Card[] = (cardsJson as RawCard[]).map((c) => ({
  id: `c${c.lv}-${fnv1a(`${c.lv}|${c.t}`)}`,
  front: c.t,
  back: c.b,
  level: c.lv,
}));

export const QUIZZES: Quiz[] = (quizzesJson as RawQuiz[]).map((q) => ({
  level: q.lv,
  name: q.nome,
  questions: q.qs.map((x) => ({ q: x.q, options: x.o, answer: x.a, why: x.why })),
}));

export const GLOSSARY: GlossaryEntry[] = (glossaryJson as RawGlossary[]).map((g) => ({
  term: g.t,
  def: g.d,
  tag: g.tag,
  extra: g.x,
}));

export function missionById(id: string): Mission | undefined {
  const i = missionIndex.get(id);
  return i === undefined ? undefined : MISSIONS[i];
}

/** missão seguinte na ordem canónica (para o botão "Próxima missão") */
export function nextMissionAfter(id: string): Mission | undefined {
  const i = missionIndex.get(id);
  return i === undefined ? undefined : MISSIONS[i + 1];
}

export function missionsOfLevel(level: number): Mission[] {
  return MISSIONS.filter((m) => m.level === level);
}

export function levelByN(n: number): Level | undefined {
  return LEVELS.find((l) => l.n === n);
}

export function quizOfLevel(level: number): Quiz | undefined {
  return QUIZZES.find((q) => q.level === level);
}

export function cardById(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}
