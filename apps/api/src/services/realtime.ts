/**
 * Real-time mínimo via SSE: subscribers por equipa/utilizador; publish em mutações
 * (progresso, atribuições, equipa). Clientes fazem refetch dos queries relevantes.
 */
import type { Response } from "express";

interface Sub {
  teamId: string | null;
  userId: string;
  res: Response;
}
const subs = new Set<Sub>();

export function subscribe(teamId: string | null, userId: string, res: Response) {
  const sub: Sub = { teamId, userId, res };
  subs.add(sub);
  res.on("close", () => subs.delete(sub));
  return () => subs.delete(sub);
}

export function publish(teamId: string | null, type: string, payload: Record<string, unknown> = {}) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const s of subs) {
    if (s.teamId && s.teamId === teamId) {
      try { s.res.write(data); } catch { subs.delete(s); }
    }
  }
}

// heartbeat p/ manter ligação viva
setInterval(() => {
  for (const s of subs) {
    try { s.res.write(": ping\n\n"); } catch { subs.delete(s); }
  }
}, 25_000).unref?.();
