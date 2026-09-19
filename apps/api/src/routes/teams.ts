import { Router } from "express";
import {
  createTeamSchema,
  joinTeamSchema,
  summarizeProgress,
  teamAiSettingsSchema,
  type MemberSummary,
} from "@phc/shared";
import { conflict, forbidden, notFound } from "../lib/errors.ts";
import { User } from "../models/User.ts";
import { Team, generateInviteCode, type TeamDoc } from "../models/Team.ts";
import { RefreshToken } from "../models/RefreshToken.ts";
import { Progress, getOrCreateProgress } from "../models/Progress.ts";
import { decryptSecret, encryptSecret } from "../lib/crypto.ts";
import { globalAiKeys } from "../config/env.ts";
import { providersStatus } from "../services/aiRouter.ts";
import { requireUser, validate } from "../middleware/auth.ts";

export const teamsRouter = Router();
teamsRouter.use(requireUser);

async function loadOwnTeam(teamId: string | null): Promise<TeamDoc | null> {
  if (!teamId) return null;
  return Team.findOne({ _id: teamId });
}

function assertOwner(team: TeamDoc, userId: string): void {
  if (String(team.ownerId) !== String(userId))
    throw forbidden("Apenas o dono da equipa pode fazer isto.");
}

/** POST /api/teams — cria equipa (o utilizador passa a formador) */
teamsRouter.post("/", validate(createTeamSchema), async (req, res) => {
  const { name } = req.body as { name: string };
  const user = await User.findById(req.auth!.sub);
  if (!user) throw notFound("Utilizador não encontrado.");
  if (user.teamId) throw conflict("Já pertence a uma equipa. Saia dela antes de criar outra.");
  const team = await Team.create({ name, ownerId: user._id, inviteCode: generateInviteCode() });
  user.teamId = team._id;
  user.role = "trainer";
  await user.save();
  res.status(201).json({
    id: String(team._id),
    name: team.name,
    inviteCode: team.inviteCode,
    ownerId: String(team.ownerId),
    memberCount: 1,
    createdAt: team.createdAt.toISOString(),
  });
});

/** GET /api/teams/mine — equipa + resumo próprio + estado dos fornecedores de IA */
teamsRouter.get("/mine", async (req, res) => {
  const team = await loadOwnTeam(req.auth!.teamId);
  if (!team) {
    res.json({
      team: null,
      providers: providersStatus({ ...globalAiKeys }, `user:${req.auth!.sub}`),
    });
    return;
  }
  const memberCount = await User.countDocuments({ teamId: team._id });
  const isOwner = String(team.ownerId) === String(req.auth!.sub);
  const progress = await getOrCreateProgress(req.auth!.sub);
  const user = await User.findById(req.auth!.sub);
  const keys = resolveTeamKeys(team);
  res.json({
    team: {
      id: String(team._id),
      name: team.name,
      ownerId: String(team.ownerId),
      memberCount,
      createdAt: team.createdAt.toISOString(),
      ...(isOwner ? { inviteCode: team.inviteCode } : {}),
    },
    me: summarizeProgress(progress.state, user?.lastActiveAt?.toISOString() ?? null),
    providers: providersStatus(keys, `team:${team._id}`),
  });
});

/** POST /api/teams/join — entra pelo código de convite */
teamsRouter.post("/join", validate(joinTeamSchema), async (req, res) => {
  const { code } = req.body as { code: string };
  const team = await Team.findOne({ inviteCode: code.trim().toUpperCase() });
  if (!team) throw notFound("Código de convite inválido.");
  const user = await User.findById(req.auth!.sub);
  if (!user) throw notFound();
  if (user.teamId && String(user.teamId) === String(team._id))
    throw conflict("Já pertence a esta equipa.");
  if (user.teamId) throw conflict("Já pertence a outra equipa. Saia dela primeiro.");
  user.teamId = team._id;
  await user.save();
  await getOrCreateProgress(user._id);
  res.json({
    id: String(team._id),
    name: team.name,
    memberCount: await User.countDocuments({ teamId: team._id }),
  });
});

/** POST /api/teams/leave */
teamsRouter.post("/leave", async (req, res) => {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw notFound();
  if (!user.teamId) throw conflict("Não pertence a nenhuma equipa.");
  const team = await Team.findById(user.teamId);
  if (team && String(team.ownerId) === String(user._id)) {
    const others = await User.countDocuments({ teamId: team._id, _id: { $ne: user._id } });
    if (others > 0) throw forbidden("O dono só pode sair depois de remover os restantes membros.");
    await Team.deleteOne({ _id: team._id });
  }
  user.teamId = null;
  if (user.role === "trainer") user.role = "student";
  await user.save();
  res.json({ ok: true });
});

/** GET /api/teams/:id/dashboard — comparativo da equipa (só formador/dono) */
teamsRouter.get("/:id/dashboard", async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw notFound("Equipa não encontrada.");
  if (String(team.ownerId) !== String(req.auth!.sub))
    throw forbidden("Só o formador vê o painel da equipa.");
  const users = await User.find({ teamId: team._id }).sort({ name: 1 });
  const docs = await Progress.find({ userId: { $in: users.map((u) => u._id) } });
  const byUser = new Map(docs.map((d) => [String(d.userId), d]));
  const members: MemberSummary[] = users.map((u) => {
    const doc = byUser.get(String(u._id));
    const uid = String(u._id);
    return {
      userId: uid,
      name: u.name,
      email: u.email,
      role: u.role,
      ...(doc
        ? summarizeProgress(doc.state, u.lastActiveAt?.toISOString() ?? null)
        : {
            reps: 0,
            mastered: 0,
            cardsMastered: 0,
            quizzesPassed: 0,
            evidences: 0,
            streak: 0,
            xp: 0,
            pct: 0,
            belt: 0,
            achievements: 0,
            lastActive: u.lastActiveAt?.toISOString() ?? null,
          }),
    } as MemberSummary;
  });
  res.json({
    team: {
      id: String(team._id),
      name: team.name,
      inviteCode: team.inviteCode,
      ownerId: String(team.ownerId),
      memberCount: users.length,
      createdAt: team.createdAt.toISOString(),
    },
    members,
  });
});

/** POST /api/teams/:id/rotate-invite — novo código de convite (dono) */
teamsRouter.post("/:id/rotate-invite", async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw notFound();
  assertOwner(team, req.auth!.sub);
  team.inviteCode = generateInviteCode();
  await team.save();
  res.json({ inviteCode: team.inviteCode });
});

/** chaves da equipa (decifradas) + fallback global por env */
export function resolveTeamKeys(team: TeamDoc | null): Record<string, string> {
  const out: Record<string, string> = { ...globalAiKeys };
  if (team?.aiKeys) {
    for (const [id, enc] of Object.entries(team.aiKeys as Record<string, string>)) {
      try {
        out[id] = decryptSecret(enc);
      } catch {
        /* chave cifrada com ENCRYPTION_KEY antiga — ignora */
      }
    }
  }
  return out;
}

/** GET /api/teams/:id/ai-settings — estado das chaves (dono) */
teamsRouter.get("/:id/ai-settings", async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw notFound();
  assertOwner(team, req.auth!.sub);
  const masked: Record<string, string> = {};
  for (const [id, enc] of Object.entries(team.aiKeys as Record<string, string>)) {
    try {
      const plain = decryptSecret(enc);
      masked[id] = "****" + plain.slice(-4);
    } catch {
      masked[id] = "(inválida)";
    }
  }
  res.json({
    keys: masked,
    order: team.aiOrder,
    providers: providersStatus(resolveTeamKeys(team), `team:${team._id}`),
  });
});

/** PUT /api/teams/:id/ai-settings — grava chaves/ordem (dono; cifra em repouso) */
teamsRouter.put("/:id/ai-settings", validate(teamAiSettingsSchema), async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw notFound();
  assertOwner(team, req.auth!.sub);
  const { keys, order } = req.body as { keys?: Record<string, string>; order?: string[] };
  if (keys) {
    const current = { ...(team.aiKeys as Record<string, string>) };
    for (const [id, val] of Object.entries(keys)) {
      if (!val || !val.trim()) delete current[id];
      else current[id] = encryptSecret(val.trim());
    }
    team.aiKeys = current;
  }
  if (order) team.aiOrder = order;
  await team.save();
  res.json({ ok: true, providers: providersStatus(resolveTeamKeys(team), `team:${team._id}`) });
});

/* ================= gestão de membros (dono/formador) ================= */
import { toPublicUser, type UserDoc } from "../models/User.ts";

async function loadTeamForOwner(req: import("express").Request) {
  const team = await Team.findById(req.params.id);
  if (!team) throw notFound("Equipa não encontrada.");
  if (String(team.ownerId) !== String(req.auth!.sub) && req.auth!.role !== "admin") {
    throw forbidden("Apenas o dono da equipa (ou admin).");
  }
  return team;
}

/** GET /api/teams/:id/members — membros c/ resumo de progresso */
teamsRouter.get("/:id/members", requireUser, async (req, res) => {
  const team = await loadTeamForOwner(req);
  const users = await User.find({ teamId: team._id }).sort({ name: 1 });
  const docs = await Progress.find({ userId: { $in: users.map((u) => u._id) } });
  const byUser = new Map(docs.map((d) => [String(d.userId), d]));
  res.json({
    members: users.map((u) => ({
      user: toPublicUser(u as UserDoc),
      summary: byUser.has(String(u._id))
        ? summarizeProgress(byUser.get(String(u._id))!.state, u.lastActiveAt?.toISOString() ?? null)
        : null,
    })),
  });
});

/** POST /api/teams/:id/members/:userId/remove — tira da equipa */
teamsRouter.post("/:id/members/:userId/remove", requireUser, async (req, res) => {
  const team = await loadTeamForOwner(req);
  const u = await User.findById(req.params.userId);
  if (!u || String(u.teamId) !== String(team._id)) throw notFound("Membro não pertence à equipa.");
  if (String(u._id) === String(team.ownerId)) throw forbidden("Não pode remover o dono.");
  u.teamId = null;
  if (u.role === "trainer") u.role = "student";
  await u.save();
  res.json({ ok: true });
});

/** POST /api/teams/:id/members/:userId/promote — trainer↔student */
teamsRouter.post("/:id/members/:userId/promote", requireUser, async (req, res) => {
  const team = await loadTeamForOwner(req);
  const u = await User.findById(req.params.userId);
  if (!u || String(u.teamId) !== String(team._id)) throw notFound("Membro não pertence à equipa.");
  if (String(u._id) === String(team.ownerId)) throw forbidden("O dono já é formador.");
  u.role = u.role === "trainer" ? "student" : "trainer";
  await u.save();
  res.json({ ok: true, role: u.role });
});

/** POST /api/teams/:id/members/:userId/group — define turma/grupo */
teamsRouter.post("/:id/members/:userId/group", requireUser, async (req, res) => {
  const team = await loadTeamForOwner(req);
  const u = await User.findById(req.params.userId);
  if (!u || String(u.teamId) !== String(team._id)) throw notFound("Membro não pertence à equipa.");
  u.group = String((req.body as { group?: string }).group || "");
  await u.save();
  res.json({ ok: true, group: u.group });
});

/** POST /api/teams/:id/members/:userId/deactivate — desativa membro (dono) */
teamsRouter.post("/:id/members/:userId/deactivate", requireUser, async (req, res) => {
  const team = await loadTeamForOwner(req);
  const u = await User.findById(req.params.userId);
  if (!u || String(u.teamId) !== String(team._id)) throw notFound("Membro não pertence à equipa.");
  if (String(u._id) === String(team.ownerId)) throw forbidden("Não pode desativar o dono.");
  u.deactivated = true;
  await u.save();
  await RefreshToken.updateMany({ userId: u._id, revokedAt: null }, { revokedAt: new Date() });
  res.json({ ok: true });
});
