/** JWT: access curto (memória do cliente) + refresh longo (rotação, hash em BD). */
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { sha256 } from "./crypto.ts";

export interface AccessClaims {
  sub: string;
  role: "student" | "trainer" | "admin";
  teamId: string | null;
}

export interface RefreshClaims {
  sub: string;
  jti: string;
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(
    { sub: claims.sub, role: claims.role, teamId: claims.teamId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TTL as jwt.SignOptions["expiresIn"] },
  );
}

export function verifyAccessToken(token: string): AccessClaims {
  const p = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & AccessClaims;
  return { sub: String(p.sub), role: p.role, teamId: p.teamId ?? null };
}

export function newRefreshToken(userId: string): {
  token: string;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const jti = randomUUID();
  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TTL_DAYS}d`,
  });
  return {
    token,
    jti,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 86400_000),
  };
}

export function verifyRefreshToken(token: string): RefreshClaims {
  const p = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & RefreshClaims;
  return { sub: String(p.sub), jti: String(p.jti) };
}

export function hashRefreshToken(token: string): string {
  return sha256(token);
}
