import { Router, type Response } from "express";
import type { z } from "zod";
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
  type AuthResponse,
} from "@phc/shared";
import { conflict, forbidden, unauthorized } from "../lib/errors.ts";
import { User, toPublicUser, type UserDoc } from "../models/User.ts";
import { Team } from "../models/Team.ts";
import { RefreshToken } from "../models/RefreshToken.ts";
import { getOrCreateProgress } from "../models/Progress.ts";
import { hashPassword, verifyPassword } from "../lib/password.ts";
import {
  hashRefreshToken,
  newRefreshToken,
  signAccessToken,
  verifyRefreshToken,
} from "../lib/jwt.ts";
import { isProd } from "../config/env.ts";
import { requireUser, validate } from "../middleware/auth.ts";

export const REFRESH_COOKIE = "phc_rt";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
    maxAge: 30 * 86400_000,
  });
}

async function issueSession(
  user: UserDoc,
  res: Response,
  userAgent: string,
): Promise<AuthResponse> {
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
    teamId: user.teamId ? String(user.teamId) : null,
  });
  const rt = newRefreshToken(String(user._id));
  await RefreshToken.create({
    userId: user._id,
    tokenHash: rt.tokenHash,
    expiresAt: rt.expiresAt,
    revokedAt: null,
    userAgent: userAgent.slice(0, 200),
  });
  setRefreshCookie(res, rt.token);
  return { accessToken, refreshToken: rt.token, user: toPublicUser(user) };
}

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw conflict("Já existe uma conta com este e-mail.");
  const isAdmin = !!env.ADMIN_EMAIL && email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: isAdmin ? "admin" : "student",
    emailVerifiedAt: isAdmin ? new Date() : null,
  });
  await getOrCreateProgress(user._id);
  if (!isAdmin) {
    const vt = await createAuthToken(user._id, "verify", 60 * 24);
    const link = `${env.APP_URL}/verificar?token=${vt}`;
    const vr = await sendEmail(
      user.email,
      "Confirme o seu email — PHC Trainer Pro",
      verifyEmailHtml(user.name, link),
      vt,
    );
    if (!vr.sent)
      console.warn(
        `[auth] registo: email de verificação NÃO enviado p/ ${user.email}: ${vr.error}`,
      );
  }
  const session = await issueSession(user, res, String(req.headers["user-agent"] || ""));
  res.status(201).json(session);
});

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized("E-mail ou palavra-passe incorretos.");
  }
  if (user.deactivated) throw forbidden("Conta desativada. Contacte o formador/administrador.");
  if (env.REQUIRE_EMAIL_VERIFICATION && !user.emailVerifiedAt) {
    throw forbidden("Confirme o seu email antes de entrar (veja a caixa de entrada).");
  }
  user.lastActiveAt = new Date();
  await user.save();
  res.json(await issueSession(user, res, String(req.headers["user-agent"] || "")));
});

authRouter.post("/refresh", validate(refreshSchema), async (req, res) => {
  const presented: string | undefined =
    req.cookies?.[REFRESH_COOKIE] ||
    (req.body as { refreshToken?: string }).refreshToken ||
    (req.headers["x-refresh-token"] as string | undefined);
  if (!presented) throw unauthorized("Refresh token em falta.");
  let claims;
  try {
    claims = verifyRefreshToken(presented);
  } catch {
    throw unauthorized("Sessão expirada. Entre novamente.");
  }
  const stored = await RefreshToken.findOne({ tokenHash: hashRefreshToken(presented) });
  if (
    !stored ||
    stored.revokedAt ||
    stored.expiresAt < new Date() ||
    String(stored.userId) !== claims.sub
  ) {
    // possível reutilização de token roubado → revoga tudo deste utilizador
    if (stored?.revokedAt)
      await RefreshToken.updateMany(
        { userId: claims.sub, revokedAt: null },
        { revokedAt: new Date() },
      );
    throw unauthorized("Sessão inválida. Entre novamente.");
  }
  stored.revokedAt = new Date();
  await stored.save();
  const user = await User.findById(claims.sub);
  if (!user) throw unauthorized("Utilizador não encontrado.");
  res.json(await issueSession(user, res, String(req.headers["user-agent"] || "")));
});

authRouter.post("/logout", async (req, res) => {
  const presented: string | undefined =
    req.cookies?.[REFRESH_COOKIE] || (req.body as { refreshToken?: string })?.refreshToken;
  if (presented) {
    await RefreshToken.updateOne(
      { tokenHash: hashRefreshToken(presented) },
      { revokedAt: new Date() },
    );
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ ok: true });
});

authRouter.get("/me", requireUser, async (req, res) => {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw unauthorized("Utilizador não encontrado.");
  let team: { id: string; name: string; inviteCode?: string; memberCount: number } | null = null;
  if (user.teamId) {
    const t = await Team.findById(user.teamId);
    if (t) {
      const memberCount = await User.countDocuments({ teamId: t._id });
      team = {
        id: String(t._id),
        name: t.name,
        memberCount,
        ...(user.role === "trainer" && String(t.ownerId) === String(user._id)
          ? { inviteCode: t.inviteCode }
          : {}),
      };
    }
  }
  res.json({ user: toPublicUser(user), team });
});

authRouter.patch("/me", requireUser, validate(updateProfileSchema), async (req, res) => {
  const { name } = req.body as { name?: string };
  const user = await User.findById(req.auth!.sub);
  if (!user) throw unauthorized();
  if (name) user.name = name;
  await user.save();
  res.json({ user: toPublicUser(user) });
});

authRouter.post(
  "/change-password",
  requireUser,
  validate(changePasswordSchema),
  async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const user = await User.findById(req.auth!.sub);
    if (!user) throw unauthorized();
    if (!(await verifyPassword(currentPassword, user.passwordHash)))
      throw unauthorized("Palavra-passe atual incorreta.");
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    res.json({
      ok: true,
      message: "Palavra-passe alterada. Volte a entrar em todos os dispositivos.",
    });
  },
);

/* ================= P1: recuperação de password + verificação de email ================= */
import { randomBytes } from "node:crypto";
import { sha256 } from "../lib/crypto.ts";
import type { Types } from "mongoose";
import { env } from "../config/env.ts";
import { PasswordResetToken } from "../models/PasswordResetToken.ts";
import { sendEmail } from "../services/email.ts";
import { verifyEmailHtml, resetEmailHtml, welcomeEmailHtml } from "../services/emailTemplates.ts";
import { forgotPasswordSchema, resetPasswordSchema } from "@phc/shared";

function newToken(): { plain: string; hash: string } {
  const plain = randomBytes(32).toString("base64url");
  return { plain, hash: sha256(plain) };
}

async function createAuthToken(
  userId: Types.ObjectId | string,
  kind: "reset" | "verify",
  ttlMin = 60,
) {
  const { plain, hash } = newToken();
  await PasswordResetToken.create({
    userId,
    kind,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + ttlMin * 60_000),
  });
  return plain;
}

/** POST /api/auth/forgot-password — envia email c/ link de reset (200 sempre, anti-enumeração) */
authRouter.post("/forgot-password", validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.deactivated) {
    res.json({
      ok: true,
      message: "Se existir uma conta com esse email, enviámos um link de recuperação.",
    });
    return;
  }
  const token = await createAuthToken(user._id, "reset", 60);
  const link = `${env.APP_URL}/resetar?token=${token}`;
  const r = await sendEmail(
    user.email,
    "Recuperar password — PHC Trainer Pro",
    resetEmailHtml(user.name, link),
    token,
  );
  if (!r.sent)
    console.warn(`[auth] forgot-password: email NÃO enviado p/ ${user.email}: ${r.error}`);
  res.json({
    ok: true,
    message: "Se existir uma conta com esse email, enviámos um link de recuperação.",
    emailSent: r.sent,
    ...(r.devToken && !isProd ? { devToken: r.devToken, devLink: link } : {}),
  });
});

/** POST /api/auth/reset-password — valida token e define nova password */
authRouter.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const doc = await PasswordResetToken.findOne({ tokenHash: sha256(token), kind: "reset" });
  if (!doc || doc.usedAt || doc.expiresAt < new Date())
    throw unauthorized("Link inválido ou expirado. Peça um novo.");
  const user = await User.findById(doc.userId);
  if (!user) throw unauthorized("Utilizador não encontrado.");
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  doc.usedAt = new Date();
  await doc.save();
  // segurança: revoga todas as sessões ativas
  await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
  res.json({ ok: true, message: "Password reposta. Entre com a nova password." });
});

/** GET /api/auth/verify/:token — confirma o email */
authRouter.get("/verify/:token", async (req, res) => {
  const doc = await PasswordResetToken.findOne({
    tokenHash: sha256(req.params.token),
    kind: "verify",
  });
  if (!doc || doc.usedAt || doc.expiresAt < new Date())
    throw unauthorized("Link de verificação inválido ou expirado.");
  const user = await User.findById(doc.userId);
  if (!user) throw unauthorized("Utilizador não encontrado.");
  const firstVerify = !user.emailVerifiedAt;
  user.emailVerifiedAt = new Date();
  await user.save();
  doc.usedAt = new Date();
  await doc.save();
  if (firstVerify) {
    await sendEmail(
      user.email,
      "Bem-vindo(a) ao PHC Trainer Pro 🎉",
      welcomeEmailHtml(user.name, env.APP_URL),
    ).catch(() => undefined);
  }
  res.json({ ok: true, message: "Email verificado com sucesso!" });
});

/** POST /api/auth/resend-verification — reenvia email de verificação (autenticado) */
authRouter.post("/resend-verification", requireUser, async (req, res) => {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw unauthorized();
  if (user.emailVerifiedAt) {
    res.json({ ok: true, message: "Este email já está verificado." });
    return;
  }
  const token = await createAuthToken(user._id, "verify", 60 * 24);
  const link = `${env.APP_URL}/verificar?token=${token}`;
  const r = await sendEmail(
    user.email,
    "Confirme o seu email — PHC Trainer Pro",
    verifyEmailHtml(user.name, link),
    token,
  );
  res.json({
    ok: true,
    message: r.sent
      ? "Email de verificação enviado."
      : `Não conseguimos enviar o email (${r.error}). Contacte o formador ou use o link manual.`,
    emailSent: r.sent,
    ...(r.devToken && !isProd ? { devToken: r.devToken, devLink: link } : {}),
  });
});
