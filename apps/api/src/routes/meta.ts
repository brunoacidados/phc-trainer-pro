import { Router } from "express";
import { CONTENT_STATS } from "@phc/content";
import {
  applyAchievements,
  cardStateSchema,
  companySchema,
  defaultProgress,
  evidenceSchema,
  labStateSchema,
  legacyImportSchema,
  planSchema,
  quizStateSchema,
  segmentById,
  settingsSchema,
  companyFromSegment,
  type ProgressState,
} from "@phc/shared";
import { getOrCreateProgress } from "../models/Progress.ts";
import { requireUser, validate } from "../middleware/auth.ts";

export const metaRouter = Router();

/** GET /api/meta/content-stats — contagens do conteúdo (público) */
metaRouter.get("/content-stats", (_req, res) => {
  res.json(CONTENT_STATS);
});

metaRouter.use(requireUser);

/* ---------- importação do JSON exportado pelo app legado (v3-v5.3) ---------- */

function coerceRecord<T>(
  raw: unknown,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
): Record<string, T> {
  const out: Record<string, T> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const r = schema.safeParse(v);
    if (r.success && r.data !== undefined) out[k] = r.data;
  }
  return out;
}

/**
 * POST /api/meta/import-legacy — migra o export JSON do PWA legado
 * (⚙️ Definições → Exportar) para a conta do utilizador.
 * Campos inválidos são ignorados; chaves de IA do legado NUNCA são importadas.
 */
metaRouter.post("/import-legacy", validate(legacyImportSchema), async (req, res) => {
  const legacy = req.body as Record<string, unknown>;
  const doc = await getOrCreateProgress(req.auth!.sub);
  const base: ProgressState = doc.state ?? defaultProgress();
  const merged: ProgressState = { ...defaultProgress(), ...base };

  const labs = coerceRecord(legacy.labs, labStateSchema) as Record<string, import("@phc/shared").LabState>;
  if (Object.keys(labs).length) merged.labs = { ...merged.labs, ...labs };

  const cards = coerceRecord(legacy.cards, cardStateSchema) as Record<string, import("@phc/shared").CardState>;
  if (Object.keys(cards).length) merged.cards = { ...merged.cards, ...cards };

  const quiz = coerceRecord(legacy.quiz, quizStateSchema) as Record<string, import("@phc/shared").QuizState>;
  if (Object.keys(quiz).length) merged.quiz = { ...merged.quiz, ...quiz };

  if (Array.isArray(legacy.evid)) {
    const evid = legacy.evid
      .map((e) => evidenceSchema.safeParse(e))
      .filter((r) => r.success)
      .map((r) => (r as { data: ProgressState["evid"][number] }).data);
    if (evid.length) merged.evid = evid.concat(merged.evid).slice(0, 5000);
  }

  if (legacy.streak && typeof legacy.streak === "object") {
    const st = legacy.streak as { last?: string | null; n?: number };
    merged.streak = { last: st.last ?? null, n: Number(st.n) || 0 };
  }

  if (legacy.stats && typeof legacy.stats === "object") {
    merged.stats = { ...merged.stats, ...(legacy.stats as ProgressState["stats"]) };
  }

  if (legacy.achs && typeof legacy.achs === "object") {
    const achs: Record<string, string> = {};
    for (const [k, v] of Object.entries(legacy.achs as Record<string, unknown>)) {
      if (typeof v === "string") achs[k] = v;
    }
    merged.achs = { ...merged.achs, ...achs };
  }

  const company = companySchema.safeParse(legacy.company);
  if (company.success && segmentById(company.data.segId))
    merged.company = company.data as ProgressState["company"];

  const plan = planSchema.safeParse(legacy.plan ?? null);
  if (plan.success && plan.data) merged.plan = plan.data;

  if (legacy.contexto && typeof legacy.contexto === "object") {
    const c = legacy.contexto as { pais?: string; gama?: string };
    if (c.pais) merged.contexto.pais = String(c.pais);
    if (c.gama) merged.contexto.gama = String(c.gama);
  }

  // definições: apenas campos conhecidos (as chaves de IA do legado são descartadas)
  const settings = settingsSchema.safeParse(legacy.settings ?? {});
  if (settings.success) {
    const KNOWN = new Set([
      "tts",
      "rate",
      "economy",
      "ttsProvider",
      "gmVoice",
      "gmModel",
      "elVoice",
      "grVoice",
      "ttsFallback",
      "freeMode",
    ]);
    const clean = Object.fromEntries(Object.entries(settings.data).filter(([k]) => KNOWN.has(k)));
    merged.settings = { ...merged.settings, ...clean } as typeof merged.settings;
  }

  if (typeof legacy.dbSchema === "string") merged.dbSchema = legacy.dbSchema.slice(0, 24000);
  if (legacy.ai && typeof legacy.ai === "object") {
    const cache = coerceRecord(legacy.ai, {
      safeParse: (v: unknown) => {
        const o = v as { t?: unknown; ts?: unknown };
        return typeof o?.t === "string"
          ? { success: true as const, data: { t: o.t, ts: Number(o.ts) || Date.now() } }
          : { success: false as const };
      },
    });
    merged.aiCache = { ...merged.aiCache, ...cache };
  }
  if (typeof legacy.onboarded === "boolean") merged.onboarded = legacy.onboarded;

  merged.v = 3;
  doc.state = merged;
  applyAchievements(doc.state);
  doc.markModified("state");
  await doc.save();

  res.json({
    ok: true,
    imported: {
      labs: Object.keys(labs).length,
      cards: Object.keys(cards).length,
      evidences: merged.evid.length,
      achievements: Object.keys(merged.achs).length,
    },
    state: doc.state,
  });
});

/** POST /api/meta/reset — repõe o progresso (mantém conta/equipa) */
metaRouter.post("/reset", async (req, res) => {
  const doc = await getOrCreateProgress(req.auth!.sub);
  const company = doc.state?.company;
  doc.state = defaultProgress();
  if (company) doc.state.company = company;
  doc.markModified("state");
  await doc.save();
  res.json({ ok: true, state: doc.state });
});

export { companyFromSegment };
