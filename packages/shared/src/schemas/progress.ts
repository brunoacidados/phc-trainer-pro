/**
 * Schemas Zod — contrato único entre web e API (validação nos dois lados).
 * Zod v4.
 */
import { z } from "zod";
import { SEGMENTS, companyFromSegment } from "../company.ts";
import {
  DEFAULT_GM_MODEL,
  DEFAULT_GM_VOICE,
  DEFAULT_TTS_PROVIDER,
  STATE_VERSION,
  defaultSettings,
} from "../defaults.ts";
import type { ProgressState, UserSettings } from "../types.ts";

/* ============ progresso ============ */

export const labStateSchema = z.looseObject({
  c: z.number().int().min(0).default(0),
  due: z.string().nullable().default(null),
  mem: z.boolean().default(false),
  steps: z.record(z.string(), z.boolean()).default({}),
  proofs: z.record(z.string(), z.boolean()).default({}),
  hist: z.array(z.string()).default([]),
  timed: z.array(z.number()).optional(),
});

export const cardStateSchema = z.looseObject({
  c: z.number().int().min(0).default(0),
  due: z.string().nullable().default(null),
});

export const quizStateSchema = z.looseObject({
  best: z.number().min(0).max(100).default(0),
  passed: z.boolean().default(false),
  tries: z.number().int().min(0).default(0),
});

export const evidenceSchema = z.looseObject({
  d: z.string(),
  lab: z.string(),
  kind: z.string(),
  txt: z.string().max(500),
});

export const settingsSchema = z.looseObject({
  tts: z.boolean().default(true),
  rate: z.number().min(0.5).max(2).default(1),
  economy: z.boolean().default(false),
  ttsProvider: z.enum(["gemini", "browser", "elevenlabs", "groq"]).default(DEFAULT_TTS_PROVIDER),
  gmVoice: z.string().default(DEFAULT_GM_VOICE),
  gmModel: z.string().default(DEFAULT_GM_MODEL),
  elVoice: z.string().default("ErXwobaYiN019PkySvjV"),
  grVoice: z.string().default("troy"),
  ttsFallback: z.boolean().default(true),
  freeMode: z.boolean().default(false),
  ttsTouched: z.boolean().optional(),
});

export const companySchema = z.looseObject({
  segId: z.string(),
  segNome: z.string(),
  segIco: z.string().optional(),
  nome: z.string(),
  curto: z.string().optional(),
  prefixo: z.string().optional(),
  nif: z.string().optional(),
  morada: z.string().optional(),
  cidade: z.string().optional(),
  cae: z.string().optional(),
  cliente: z.string().optional(),
  clienteCurto: z.string().optional(),
  fornecedor: z.string().optional(),
  fornecedorCurto: z.string().optional(),
});

export const planSchema = z
  .looseObject({
    porIA: z.boolean().optional(),
    ordem: z.array(z.string()).default([]),
    destaques: z.array(z.string()).optional(),
    nota: z.string().optional(),
    objetivos: z.array(z.string()).optional(),
    interesses: z.string().optional(),
  })
  .nullable();

export const progressStateSchema = z.looseObject({
  v: z.number().default(STATE_VERSION),
  labs: z.record(z.string(), labStateSchema).default({}),
  cards: z.record(z.string(), cardStateSchema).default({}),
  quiz: z.record(z.string(), quizStateSchema).default({}),
  evid: z.array(evidenceSchema).default([]),
  streak: z
    .looseObject({ last: z.string().nullable().default(null), n: z.number().default(0) })
    .default({
      last: null,
      n: 0,
    }),
  daily: z
    .looseObject({
      d: z.string().default(""),
      reps: z.number().default(0),
      cards: z.number().default(0),
      proofs: z.number().default(0),
      lessons: z.number().default(0),
    })
    .default({ d: "", reps: 0, cards: 0, proofs: 0, lessons: 0 }),
  stats: z
    .looseObject({
      lessons: z.number().default(0),
      chats: z.number().default(0),
      dict: z.number().default(0),
      circ: z.number().default(0),
      explics: z.number().default(0),
    })
    .default({ lessons: 0, chats: 0, dict: 0, circ: 0, explics: 0 }),
  achs: z.record(z.string(), z.string()).default({}),
  company: companySchema.optional(),
  plan: planSchema.default(null),
  contexto: z
    .looseObject({ pais: z.string().default("PT"), gama: z.string().default("Advanced") })
    .default({
      pais: "PT",
      gama: "Advanced",
    }),
  settings: settingsSchema.default({ ...defaultSettings() } as UserSettings &
    Record<string, unknown>),
  aiCache: z.record(z.string(), z.looseObject({ t: z.string(), ts: z.number() })).default({}),
  dbSchema: z.string().max(24000).default(""),
  onboarded: z.boolean().default(false),
});

/** body do PUT /api/progress — atualização parcial (merge no servidor) */
export const updateProgressSchema = progressStateSchema.partial().omit({ v: true });

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

/* ============ ações atómicas (servidor calcula SRS) ============ */

export const registerRepSchema = z.object({
  labId: z.string().regex(/^L\d{2}$/),
  timedSec: z.number().int().min(0).max(86400).optional(),
});

export const toggleIndexSchema = z.object({
  labId: z.string().regex(/^L\d{2}$/),
  index: z.number().int().min(0).max(200),
});

export const addEvidenceSchema = z.object({
  lab: z.string().regex(/^L\d{2}$/),
  kind: z.enum(["print", "sql", "file", "oral"]),
  txt: z.string().min(3).max(500),
});

export const rateCardActionSchema = z.object({
  idx: z.number().int().min(0),
  q: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});

export const submitQuizActionSchema = z.object({
  lv: z.number().int().min(0).max(12),
  pct: z.number().min(0).max(100),
});

export const bumpStatSchema = z.object({
  kind: z.enum(["lesson", "chat", "dict", "circ", "explic"]),
});

export const setCompanySchema = z.object({
  segId: z.string(),
  nome: z.string().max(120).optional(),
  cidade: z.string().max(80).optional(),
});

export const setContextoSchema = z.object({
  pais: z.enum(["PT", "ES", "AO", "MZ", "CV", "PE"]),
  gama: z.enum(["Corporate", "Advanced", "Enterprise"]),
});

/* ============ importação do legado ============ */

/** export JSON do app legado (localStorage phcTrainerPro.v3) — aceite com tolerância */
export const legacyImportSchema = z.looseObject({
  labs: z.record(z.string(), z.unknown()).optional(),
  cards: z.record(z.string(), z.unknown()).optional(),
  quiz: z.record(z.string(), z.unknown()).optional(),
  evid: z.array(z.unknown()).optional(),
  streak: z.unknown().optional(),
  daily: z.unknown().optional(),
  stats: z.unknown().optional(),
  achs: z.record(z.string(), z.unknown()).optional(),
  company: z.unknown().optional(),
  plan: z.unknown().optional(),
  contexto: z.unknown().optional(),
  settings: z.unknown().optional(),
  ai: z.record(z.string(), z.unknown()).optional(),
  dbSchema: z.unknown().optional(),
  onboarded: z.unknown().optional(),
});

/* helpers re-exportados p/ conveniência dos consumidores */
export { SEGMENTS, companyFromSegment, defaultSettings };
export type { ProgressState };
