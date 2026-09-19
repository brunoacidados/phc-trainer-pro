import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { z } from "zod";
import { badRequest, forbidden, unauthorized } from "../lib/errors.ts";
import { User } from "../models/User.ts";
import { verifyAccessToken, type AccessClaims } from "../lib/jwt.ts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessClaims;
    }
  }
}

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) return h.slice(7).trim();
  return null;
}

/**
 * Exige access token válido e revalida o utilizador contra a BD —
 * role/teamId são sempre atuais (o token pode ter claims desatualizados
 * após criar/entrar/sair de equipa).
 */
export async function requireUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = bearer(req);
  if (!token) throw unauthorized("Token de acesso em falta.");
  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    throw unauthorized();
  }
  const user = await User.findById(claims.sub).lean();
  if (!user) throw unauthorized("Utilizador não encontrado.");
  req.auth = {
    sub: String(user._id),
    role: user.role,
    teamId: user.teamId ? String(user.teamId) : null,
  };
  next();
}

/** só admin global */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.role !== "admin") throw forbidden("Apenas administradores.");
  next();
}

/** só formador (dono de equipa) */
export function requireTrainer(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.role !== "trainer") throw forbidden("Apenas formadores podem executar esta ação.");
  next();
}

/** valida o body com Zod e substitui pelo resultado parseado */
export function validate<T extends ZodType>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const r = schema.safeParse(req.body ?? {});
    if (!r.success) {
      throw badRequest("Dados inválidos.", z.treeifyError(r.error));
    }
    req.body = r.data;
    next();
  };
}
