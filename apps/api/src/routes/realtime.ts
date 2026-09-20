import { Router } from "express";
import { verifyAccessToken } from "../lib/jwt.ts";
import { User } from "../models/User.ts";
import { subscribe } from "../services/realtime.ts";

export const realtimeRouter = Router();

/** GET /api/events?token=<access> — stream SSE de eventos da equipa */
realtimeRouter.get("/events", async (req, res) => {
  const token = (req.query.token as string) || "";
  let claims;
  try { claims = verifyAccessToken(token); } catch { res.status(401).json({ error: "token" }); return; }
  const user = await User.findById(claims.sub);
  if (!user) { res.status(401).json({ error: "user" }); return; }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  const teamId = user.teamId ? String(user.teamId) : null;
  subscribe(teamId, String(user._id), res);
});
