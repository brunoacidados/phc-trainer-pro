import "server-only";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";

export const PROFILE_COOKIE = "phc_profile";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

/** Perfil atual ou null (nunca lança). */
export async function getProfile(): Promise<Profile | null> {
  const jar = await cookies();
  const id = jar.get(PROFILE_COOKIE)?.value;
  if (!id || !isUuid(id)) return null;
  const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Perfil atual ou redireciona para /comecar. */
export async function requireProfile(): Promise<Profile> {
  const p = await getProfile();
  if (!p) redirect("/comecar");
  return p;
}

export async function setProfileCookie(id: string): Promise<void> {
  const jar = await cookies();
  const h = await headers();
  // "secure" só quando o pedido chegou por HTTPS (direto ou via proxy);
  // evita perder a sessão em pré-visualizações locais por HTTP.
  const https = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https";
  jar.set(PROFILE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearProfileCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(PROFILE_COOKIE);
}
