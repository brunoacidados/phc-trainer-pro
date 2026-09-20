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
adminRouter.get("/users", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(10, Number(req.query.limit) || 50));
  const total = await User.countDocuments();
  const users = await User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  const teams = await Team.find();
  const teamName = new Map(teams.map((t) => [String(t._id), t.name]));
  res.json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
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
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        n: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json({ total, active7, active1, teams, verified, signups });
});

/* ================= recuperação/verificação via admin (fallback sem email) ================= */
import { randomBytes } from "node:crypto";
import { PasswordResetToken } from "../models/PasswordResetToken.ts";
import { sha256 } from "../lib/crypto.ts";
import { env } from "../config/env.ts";
import { emailConfigWarning, emailProvider } from "../services/email.ts";
import { hashPassword } from "../lib/password.ts";

/** POST /api/admin/users/:id/verify — marca email como verificado */
adminRouter.post("/users/:id/verify", async (req, res) => {
  const u = await loadUser(req.params.id);
  u.emailVerifiedAt = new Date();
  await u.save();
  res.json({ ok: true, user: toPublicUser(u) });
});

/** POST /api/admin/users/:id/reset-link — gera link de reset p/ o admin partilhar manualmente */
adminRouter.post("/users/:id/reset-link", async (req, res) => {
  const u = await loadUser(req.params.id);
  const plain = randomBytes(32).toString("base64url");
  await PasswordResetToken.create({
    userId: u._id,
    kind: "reset",
    tokenHash: sha256(plain),
    expiresAt: new Date(Date.now() + 60 * 60_000),
  });
  res.json({ ok: true, link: `${env.APP_URL}/resetar?token=${plain}`, expiresMin: 60 });
});

/** POST /api/admin/users/:id/temp-password — define password temporária e devolve-a */
adminRouter.post("/users/:id/temp-password", async (req, res) => {
  const u = await loadUser(req.params.id);
  const temp = "Phc-" + randomBytes(6).toString("base64url");
  u.passwordHash = await hashPassword(temp);
  u.deactivated = false;
  await u.save();
  await RefreshToken.updateMany({ userId: u._id, revokedAt: null }, { revokedAt: new Date() });
  res.json({ ok: true, tempPassword: temp });
});

/** GET /api/admin/email-status — diagnóstico de porque os emails podem não sair */
adminRouter.get("/email-status", (_req, res) => {
  res.json({
    warning: emailConfigWarning(),
    provider: emailProvider(),
    smtpConfigured: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
    resendConfigured: !!env.RESEND_API_KEY,
    appUrl: env.APP_URL,
    emailFrom: env.EMAIL_FROM,
    appUrlIsLocal: /localhost|127\.0\.0\.1/.test(env.APP_URL),
    fromIsResendDefault: /onboarding@resend\.dev/.test(env.EMAIL_FROM),
  });
});
