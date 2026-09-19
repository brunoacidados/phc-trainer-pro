import { Router } from "express";
import { ChatHistory, getChat } from "../models/ChatHistory.ts";
import { requireUser } from "../middleware/auth.ts";

export const chatRouter = Router();
chatRouter.use(requireUser);

/** GET /api/chat — histórico de conversas do utilizador com o Professor */
chatRouter.get("/", async (req, res) => {
  const messages = await getChat(req.auth!.sub);
  res.json({ messages });
});

/** DELETE /api/chat — limpa o histórico */
chatRouter.delete("/", async (req, res) => {
  await ChatHistory.deleteOne({ userId: req.auth!.sub });
  res.json({ ok: true });
});
