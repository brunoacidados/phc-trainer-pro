/**
 * @phc/content — conteúdo estático do PHC Trainer Pro.
 * Extraído do app legado (index.html v5.3.0) por scripts/extract-legacy-content.mjs.
 * Regra: estes ficheiros são a fonte de verdade do conteúdo pedagógico.
 */
import type {
  Achievement,
  AiProviderDef,
  Belt,
  Circuit,
  Country,
  CursoOficial,
  EncRef,
  Encyclopedia,
  FlashCard,
  GlossaryTerm,
  GradeNotes,
  Guide,
  Lab,
  MissionTheory,
  PhcSchema,
  Prompts,
  Quiz,
  SectorCyclePhase,
  SectorLevelCase,
  SectorVertical,
  Segment,
  SqlPrompts,
  Voices,
} from "./types.ts";

import beltsData from "./data/belts.json";
import labsData from "./data/labs.json";
import theoryData from "./data/theory.json";
import cardsData from "./data/cards.json";
import quizzesData from "./data/quizzes.json";
import segmentsData from "./data/segments.json";
import glossaryData from "./data/glossary.json";
import circuitsData from "./data/circuits.json";
import countriesData from "./data/countries.json";
import gradeNotesData from "./data/grade-notes.json";
import encyclopediaData from "./data/encyclopedia.json";
import schemaData from "./data/schema.json";
import guideData from "./data/guide.json";
import achievementsData from "./data/achievements.json";
import voicesData from "./data/voices.json";
import encRefData from "./data/enc-ref.json";
import contabOficialData from "./data/contab-oficial.json";
import sectorPortasData from "./data/sector-portas.json";
import aiProvidersData from "./data/ai-providers.json";
import promptsData from "./data/prompts.json";
import promptsSqlData from "./data/prompts-sql.json";

export const BELTS = beltsData as unknown as Belt[];
export const LABS = labsData as unknown as Lab[];
export const THEORY = theoryData as unknown as Record<string, MissionTheory>;
export const CARDS = cardsData as unknown as FlashCard[];
export const QUIZZES = quizzesData as unknown as Quiz[];
export const SEGMENTS = segmentsData as unknown as Segment[];
export const GLOSSARY = glossaryData as unknown as GlossaryTerm[];
export const CIRCUITS = circuitsData as unknown as Circuit[];
export const COUNTRIES = countriesData as unknown as Country[];
export const GRADE_NOTES = gradeNotesData as unknown as GradeNotes;
export const ENCYCLOPEDIA = encyclopediaData as unknown as Encyclopedia;
export const PHC_SCHEMA = schemaData as unknown as PhcSchema;
export const GUIDE = guideData as unknown as Guide;
export const ACHIEVEMENTS = achievementsData as unknown as Achievement[];
export const VOICES = voicesData as unknown as Voices;
export const ENC_REF = encRefData as unknown as EncRef;
/** programa oficial PHC do módulo Contabilidade (certificação, aulas, manuais, vídeos) */
export const CONTAB_OFICIAL = contabOficialData as unknown as CursoOficial;
/** trilha vertical do setor Portas & Automatismos (empresa fictícia PORTALUSA) */
export const SECTOR_PORTAS = sectorPortasData as unknown as SectorVertical;
export const AI_PROVIDERS = aiProvidersData as unknown as AiProviderDef[];
export const PROMPTS = promptsData as unknown as Prompts;
export const SQL_PROMPTS = promptsSqlData as unknown as SqlPrompts;

/* ---------- helpers de lookup ---------- */

export function labById(id: string): Lab | undefined {
  return LABS.find((l) => l.id === id);
}

export function theoryFor(labId: string): MissionTheory | undefined {
  return THEORY[labId];
}

export function quizForLevel(lv: number): Quiz | undefined {
  return QUIZZES.find((q) => q.lv === lv);
}

export function segmentById(id: string): Segment | undefined {
  return SEGMENTS.find((s) => s.id === id);
}

export function countryById(id: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function beltForLevel(lv: number): Belt {
  return BELTS[lv] ?? BELTS[0];
}

/** caso prático do setor Portas & Automatismos para um nível */
export function sectorCaseForLevel(lv: number): SectorLevelCase | undefined {
  return SECTOR_PORTAS.porNivel.find((c) => c.level === lv);
}

/** fases do ciclo ERP do setor que envolvem uma dada missão */
export function sectorPhasesForMission(labId: string): SectorCyclePhase[] {
  return SECTOR_PORTAS.ciclo.filter((f) => f.missoes.includes(labId));
}

export const CONTENT_STATS = {
  labs: LABS.length,
  cards: CARDS.length,
  quizzes: QUIZZES.length,
  quizQuestions: QUIZZES.reduce((n, q) => n + q.qs.length, 0),
  segments: SEGMENTS.length,
  glossary: GLOSSARY.length,
  circuits: CIRCUITS.length,
  countries: COUNTRIES.length,
  achievements: ACHIEVEMENTS.length,
  encFuncoes: ENCYCLOPEDIA.funcoes.length,
  encVfp: ENCYCLOPEDIA.vfp.length,
  encDicas: ENCYCLOPEDIA.dicas.length,
  encErros: ENCYCLOPEDIA.erros.length,
  encProg: ENCYCLOPEDIA.prog.length,
  encArtigos: Object.keys(ENCYCLOPEDIA.artigos).length,
  encManual: Object.keys(ENCYCLOPEDIA.manual).length,
} as const;

export * from "./types.ts";
export * from "./courses.ts";
