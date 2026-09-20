import { Router } from "express";
import {
  addEvidenceSchema,
  applyAchievements,
  bumpStatSchema,
  defaultProgress,
  labSt,
  rateCard,
  rateCardActionSchema,
  registerLabRep,
  registerRepSchema,
  setCompanySchema,
  setContextoSchema,
  settingsSchema,
  submitQuiz,
  submitQuizActionSchema,
  toggleIndexSchema,
  toggleProof,
  toggleStep,
  todayISO,
  updateProgressSchema,
  type ProgressState,
} from "@phc/shared";
import { companyFromSegment } from "@phc/shared";
import { getOrCreateProgress } from "../models/Progress.ts";
import { User } from "../models/User.ts";
import { notFound } from "../lib/errors.ts";
import { requireUser, validate } from "../middleware/auth.ts";
import { publish } from "../services/realtime.ts";

export const progressRouter = Router();
progressRouter.use(requireUser);

const MAX_AI_CACHE = 600;

function trimAiCache(s: ProgressState): void {
  const ks = Object.keys(s.aiCache || {});
  if (ks.length <= MAX_AI_CACHE) return;
  ks.sort((a, b) => (s.aiCache[a].ts || 0) - (s.aiCache[b].ts || 0))
    .slice(0, ks.length - MAX_AI_CACHE)
    .forEach((k) => delete s.aiCache[k]);
}

async function save(doc: Awaited<ReturnType<typeof getOrCreateProgress>>, userId: string) {
  trimAiCache(doc.state);
  applyAchievements(doc.state);
  doc.markModified("state");
  await doc.save();
  await User.updateOne(
    {
      _id: userId,
      $or: [{ lastActiveAt: null }, { lastActiveAt: { $lt: new Date(Date.now() - 5 * 60_000) } }],
    },
    { lastActiveAt: new Date() },
  );
  const _teamId = (doc as unknown as { teamId?: string | null }).teamId;
  if (_teamId) publish(_teamId, "progress", { userId: String(userId) });
  return doc.state;
}

/** GET /api/progress — estado completo (cria por omissão na 1ª vez) */
progressRouter.get("/", async (req, res) => {
  const doc = await getOrCreateProgress(req.auth!.sub);
  res.json({ state: doc.state, updatedAt: doc.updatedAt });
});

/** PUT /api/progress — merge parcial (sincronização do cliente) */
progressRouter.put("/", validate(updateProgressSchema), async (req, res) => {
  const doc = await getOrCreateProgress(req.auth!.sub);
  const patch = req.body as Partial<ProgressState>;
  doc.state = { ...defaultProgress(), ...doc.state, ...patch, v: 3 };
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** POST /api/progress/reps — regista repetição (SRS calculado no servidor) */
progressRouter.post("/reps", validate(registerRepSchema), async (req, res) => {
  const { labId, timedSec } = req.body as { labId: string; timedSec?: number };
  const doc = await getOrCreateProgress(req.auth!.sub);
  const st = registerLabRep(doc.state, labId);
  if (typeof timedSec === "number") (st.timed ||= []).push(timedSec);
  const unlocked = applyAchievements(doc.state);
  res.json({ state: await save(doc, req.auth!.sub), unlocked });
});

/** POST /api/progress/steps — alterna passo concluído */
progressRouter.post("/steps", validate(toggleIndexSchema), async (req, res) => {
  const { labId, index } = req.body as { labId: string; index: number };
  const doc = await getOrCreateProgress(req.auth!.sub);
  toggleStep(doc.state, labId, index);
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** POST /api/progress/proofs — alterna prova concluída */
progressRouter.post("/proofs", validate(toggleIndexSchema), async (req, res) => {
  const { labId, index } = req.body as { labId: string; index: number };
  const doc = await getOrCreateProgress(req.auth!.sub);
  toggleProof(doc.state, labId, index);
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** POST /api/progress/mastered — "sei de cor" */
progressRouter.post("/mastered", validate(registerRepSchema), async (req, res) => {
  const { labId } = req.body as { labId: string };
  const doc = await getOrCreateProgress(req.auth!.sub);
  labSt(doc.state, labId).mem = true;
  const unlocked = applyAchievements(doc.state);
  res.json({ state: await save(doc, req.auth!.sub), unlocked });
});

/** POST /api/progress/evid — registar prova no portefólio */
progressRouter.post("/evid", validate(addEvidenceSchema), async (req, res) => {
  const { lab, kind, txt } = req.body as { lab: string; kind: string; txt: string };
  const doc = await getOrCreateProgress(req.auth!.sub);
  doc.state.evid.unshift({ d: todayISO(), lab, kind, txt });
  const unlocked = applyAchievements(doc.state);
  res.json({ state: await save(doc, req.auth!.sub), unlocked });
});

/** DELETE /api/progress/evid/:index */
progressRouter.delete("/evid/:index", async (req, res) => {
  const i = Number(req.params.index);
  const doc = await getOrCreateProgress(req.auth!.sub);
  if (!Number.isInteger(i) || i < 0 || i >= doc.state.evid.length)
    throw notFound("Prova não encontrada.");
  doc.state.evid.splice(i, 1);
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** POST /api/progress/cards/rate — avalia flashcard (0/1/2) */
progressRouter.post("/cards/rate", validate(rateCardActionSchema), async (req, res) => {
  const { idx, q } = req.body as { idx: number; q: 0 | 1 | 2 };
  const doc = await getOrCreateProgress(req.auth!.sub);
  rateCard(doc.state, idx, q);
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** POST /api/progress/quiz — submete teste de nível */
progressRouter.post("/quiz", validate(submitQuizActionSchema), async (req, res) => {
  const { lv, pct } = req.body as { lv: number; pct: number };
  const doc = await getOrCreateProgress(req.auth!.sub);
  submitQuiz(doc.state, lv, pct);
  const unlocked = applyAchievements(doc.state);
  res.json({ state: await save(doc, req.auth!.sub), unlocked });
});

/** POST /api/progress/stats — incrementa contador (lesson → também meta diária) */
progressRouter.post("/stats", validate(bumpStatSchema), async (req, res) => {
  const { kind } = req.body as { kind: "lesson" | "chat" | "dict" | "circ" | "explic" };
  const doc = await getOrCreateProgress(req.auth!.sub);
  const map = {
    lesson: "lessons",
    chat: "chats",
    dict: "dict",
    circ: "circ",
    explic: "explics",
  } as const;
  const field = map[kind];
  doc.state.stats[field] = (doc.state.stats[field] || 0) + 1;
  if (kind === "lesson") {
    const { bumpDaily } = await import("@phc/shared");
    bumpDaily(doc.state, "lessons");
  }
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** PUT /api/progress/company — define empresa de treino */
progressRouter.put("/company", validate(setCompanySchema), async (req, res) => {
  const { segId, nome, cidade } = req.body as { segId: string; nome?: string; cidade?: string };
  const doc = await getOrCreateProgress(req.auth!.sub);
  doc.state.company = companyFromSegment(segId, nome, cidade);
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** PUT /api/progress/contexto — país + gama */
progressRouter.put("/contexto", validate(setContextoSchema), async (req, res) => {
  const { pais, gama } = req.body as { pais: string; gama: string };
  const doc = await getOrCreateProgress(req.auth!.sub);
  doc.state.contexto = { pais, gama };
  res.json({ state: await save(doc, req.auth!.sub) });
});

/** PUT /api/progress/settings — definições do aluno (voz, modo livre…) */
progressRouter.put("/settings", validate(settingsSchema), async (req, res) => {
  const doc = await getOrCreateProgress(req.auth!.sub);
  doc.state.settings = { ...doc.state.settings, ...(req.body as object) };
  res.json({ state: await save(doc, req.auth!.sub) });
});
