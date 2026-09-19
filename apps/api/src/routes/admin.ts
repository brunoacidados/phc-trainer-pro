import { Router } from "express";
import { User, toPublicUser, type UserDoc } from "../models/User.ts";
import { Team } from "../models/Team.ts";
import { Progress } from "../models/Progress.ts";
import { RefreshToken } from "../models/RefreshToken.ts";
import { requireUser, requireAdmin } from "../middleware/auth.ts";
import { forbidden, notFound } from "../lib/errors.ts";

export const adminRouter = Router();
adminRouter.use(requireUser, requireAdmin);

/** GET /api/admin/users — lista global de utilizadores */
adminRouter.get("/users", async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(500);
  const teams = await Team.find();
  const teamName = new Map(teams.map((t) => [String(t._id), t.name]));
  res.json({
    users: users.map((u) => ({
      ...toPublicUser(u as UserDoc),
      teamName: u.teamId ? (teamName.get(String(u.teamId)) ?? null) : null,
      lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
    })),
  });
});

async function loadUser(id: string) {
  const u = await User.findById(id);
  if (!u) throw notFound("Utilizador não encontrado.");
  return u as UserDoc;
}

/** POST /api/admin/users/:id/deactivate | /activate */
adminRouter.post("/users/:id/deactivate", async (req, res) => {
  const u = await loadUser(req.params.id);
  if (u.role === "admin") throw forbidden("Não pode desativar um admin.");
  u.deactivated = true;
  await u.save();
  await RefreshToken.updateMany({ userId: u._id, revokedAt: null }, { revokedAt: new Date() });
  res.json({ ok: true, user: toPublicUser(u) });
});
adminRouter.post("/users/:id/activate", async (req, res) => {
  const u = await loadUser(req.params.id);
  u.deactivated = false;
  await u.save();
  res.json({ ok: true, user: toPublicUser(u) });
});

/** DELETE /api/admin/users/:id — apaga conta + progresso + tokens */
adminRouter.delete("/users/:id", async (req, res) => {
  const u = await loadUser(req.params.id);
  if (u.role === "admin") throw forbidden("Não pode apagar um admin.");
  await Progress.deleteOne({ userId: u._id });
  await RefreshToken.deleteMany({ userId: u._id });
  await User.deleteOne({ _id: u._id });
  res.json({ ok: true });
});

/** GET /api/admin/analytics — métricas de uso (P3) */
adminRouter.get("/analytics", async (_req, res) => {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400_000);
  const d1 = new Date(now - 1 * 86400_000);
  const [total, active7, active1, teams, verified] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActiveAt: { $gte: d7 } }),
    User.countDocuments({ lastActiveAt: { $gte: d1 } }),
    Team.countDocuments(),
    User.countDocuments({ emailVerifiedAt: { $ne: null } }),
  ]);
  // registos por dia (14 dias)
  const since = new Date(now - 14 * 86400_000);
  const signups = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ total, active7, active1, teams, verified, signups });
});
