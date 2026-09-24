import "server-only";
import { cookies } from "next/headers";
import { db } from "@/db";
import { learners } from "@/db/schema";
import { PREFS_COOKIE, parsePrefs, type Prefs } from "@/lib/prefs";

const LEARNER_COOKIE = "phc_uid";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** id do aluno para LEITURAS (pode não existir ainda na BD — leituras devolvem vazio) */
export async function currentLearnerId(): Promise<string | null> {
  const v = (await cookies()).get(LEARNER_COOKIE)?.value;
  return v && UUID_RE.test(v) ? v : null;
}

/** id do aluno para ESCRITAS: garante cookie + linha na BD (idempotente) */
export async function requireLearner(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(LEARNER_COOKIE)?.value;
  if (!id || !UUID_RE.test(id)) {
    id = crypto.randomUUID();
    jar.set({ name: LEARNER_COOKIE, value: id, httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
  }
  await db.insert(learners).values({ id }).onConflictDoNothing();
  return id;
}

export async function currentPrefs(): Promise<Prefs> {
  return parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
}
