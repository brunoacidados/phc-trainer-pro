import { Router } from "express";
import {
  aiChatRequestSchema,
  aiTestSchema,
  buildSystemPrompt,
  contextFromProgress,
  encContext,
  missionContext,
  schemaContext,
  SQL_RULES,
  ttsRequestSchema,
  type ChatMessage,
  type ProgressState,
} from "@phc/shared";
import { labById, theoryFor } from "@phc/content";
import { badRequest } from "../lib/errors.ts";
import { Team } from "../models/Team.ts";
import { getOrCreateProgress } from "../models/Progress.ts";
import { appendChat } from "../models/ChatHistory.ts";
import { requireUser, validate } from "../middleware/auth.ts";
import {
  routeChat,
  routeChatStream,
  providersStatus,
  testAllProviders,
  testOneProvider,
} from "../services/aiRouter.ts";
import { resolveTeamKeys } from "./teams.ts";
import { defaultOrder, envKeysMap, getRegistry, probeProvider } from "../services/providers.ts";
import { semanticSearch, ragContextBlock, ragStats } from "../services/rag.ts";
import { elevenlabsTts, geminiTts, groqTts } from "../services/tts.ts";
import { globalAiKeys } from "../config/env.ts";

export const aiRouter = Router();
aiRouter.use(requireUser);

async function resolveKeysAndOrder(teamId: string | null, userId: string) {
  const team = teamId ? await Team.findById(teamId) : null;
  // env genérico (custom+bynara) < env majors (globalAiKeys) < team (cifradas)
  const keys = { ...envKeysMap(), ...globalAiKeys, ...resolveTeamKeys(team) };
  return {
    keys,
    order: team?.aiOrder?.length ? team.aiOrder : defaultOrder(),
    scope: team ? `team:${team._id}` : `user:${userId}`,
  };
}

type AiKind = "free" | "explain" | "lesson" | "chat" | "generate";

/**
 * Constrói as mensagens finais: se a 1ª não for system, injeta a persona do
 * Professor Einstein + contexto (empresa/país/gama/plano) + missão + mini-RAG
 * da Enciclopédia + regras SQL quando o pedido envolve BD.
 */
async function composeMessages(
  messages: ChatMessage[],
  kind: AiKind,
  labId: string | undefined,
  state: ProgressState,
  keys: Record<string, string>,
): Promise<ChatMessage[]> {
  if (messages[0]?.role === "system") return messages;
  let sys = buildSystemPrompt(contextFromProgress(state));
  if (labId) {
    const lab = labById(labId);
    if (lab) sys += "\n\n" + missionContext(lab, theoryFor(labId));
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // RAG: busca semântica (se houver chunks embeddados + chave); senão, mini-RAG por palavras-chave
  let injected = false;
  try {
    const hits = await semanticSearch(lastUser, keys, 5, 0.32);
    if (hits.length) {
      sys += "\n\n" + ragContextBlock(hits);
      injected = true;
    }
  } catch {
    /* RAG indisponível → fallback abaixo */
  }
  if (!injected) {
    const enc = encContext(lastUser);
    if (enc) sys += "\n\n" + enc;
  }

  if (/\bsql\b|select\s|query|consulta|tabela|campos?\b|base de dados/i.test(lastUser)) {
    sys += "\n\n" + SQL_RULES + "\n\n" + schemaContext(lastUser, state.dbSchema);
  }
  if (kind === "chat") {
    sys +=
      "\n\nResponda em no máximo 180 palavras. Use SEMPRE a EMPRESA EM FOCO do contexto como exemplo, em linguagem simples e profissional.";
  }
  return [{ role: "system", content: sys }, ...messages];
}

async function guardEconomy(state: ProgressState, kind: AiKind): Promise<void> {
  if (state.settings.economy && kind !== "generate") {
    throw badRequest("Modo económico ativo — a IA está desligada para este aluno (Definições).");
  }
}

/** GET /api/ai/providers — estado dos fornecedores (configurado? origem? pausa?) */
aiRouter.get("/providers", async (req, res) => {
  const { keys, scope } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  res.json({ providers: providersStatus(keys, scope) });
});

/**
 * POST /api/ai/chat — tutor de IA (resposta completa). Persiste no histórico.
 */
aiRouter.post("/chat", validate(aiChatRequestSchema), async (req, res) => {
  const { messages, maxTokens, code, kind, labId } = req.body as ReturnType<
    typeof aiChatRequestSchema.parse
  >;
  if (!messages.length) throw badRequest("Mensagens vazias.");

  const progress = await getOrCreateProgress(req.auth!.sub);
  await guardEconomy(progress.state, kind);
  const { keys, order, scope } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  const finalMessages = await composeMessages(messages, kind, labId, progress.state, keys);
  const out = await routeChat({ scope, keys, order, messages: finalMessages, maxTokens, code });

  progress.state.stats.chats = (progress.state.stats.chats || 0) + 1;
  progress.markModified("state");
  await progress.save().catch(() => undefined);

  // histórico (só conversas "chat"/livres; explicações/aulas não poluem o chat)
  if (kind === "chat" || kind === "free") {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg)
      await appendChat(req.auth!.sub, { role: "user", content: lastUserMsg.content, labId }).catch(
        () => undefined,
      );
    await appendChat(req.auth!.sub, { role: "assistant", content: out.text, labId }).catch(
      () => undefined,
    );
  }

  res.json({ text: out.text, provider: out.provider, cached: false });
});

/**
 * POST /api/ai/chat-stream — igual ao /chat mas em streaming (SSE).
 * Eventos: `token` (delta), `done` ({provider}), `error` ({message}).
 */
aiRouter.post("/chat-stream", validate(aiChatRequestSchema), async (req, res) => {
  const { messages, maxTokens, code, kind, labId } = req.body as ReturnType<
    typeof aiChatRequestSchema.parse
  >;
  if (!messages.length) throw badRequest("Mensagens vazias.");

  const progress = await getOrCreateProgress(req.auth!.sub);
  await guardEconomy(progress.state, kind);
  const { keys, order, scope } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  const finalMessages = await composeMessages(messages, kind, labId, progress.state, keys);

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    const out = await routeChatStream({
      scope,
      keys,
      order,
      messages: finalMessages,
      maxTokens,
      code,
      onToken: (t) => {
        if (aborted) return;
        send("token", { t });
      },
    });
    if (aborted) {
      res.end();
      return;
    }
    send("done", { provider: out.provider });
    res.end();

    progress.state.stats.chats = (progress.state.stats.chats || 0) + 1;
    progress.markModified("state");
    await progress.save().catch(() => undefined);
    if (kind === "chat" || kind === "free") {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg)
        await appendChat(req.auth!.sub, {
          role: "user",
          content: lastUserMsg.content,
          labId,
        }).catch(() => undefined);
      await appendChat(req.auth!.sub, { role: "assistant", content: out.text, labId }).catch(
        () => undefined,
      );
    }
  } catch (e) {
    if (!aborted && !res.writableEnded) {
      send("error", { message: String((e as Error).message || e).slice(0, 300) });
      res.end();
    }
  }
});

/** POST /api/ai/tts — voz do Professor (Gemini/ElevenLabs/Groq) no servidor */
aiRouter.post("/tts", validate(ttsRequestSchema), async (req, res) => {
  const { text, provider, voice, model } = req.body as ReturnType<typeof ttsRequestSchema.parse>;
  const { keys } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  if (provider === "gemini") {
    const key = keys.gemini;
    if (!key) throw badRequest("Chave Gemini não configurada (Definições → IA da equipa).");
    res.json(await geminiTts(key, text, voice || "Sulafat", model));
    return;
  }
  if (provider === "elevenlabs") {
    const key = keys.elevenlabs;
    if (!key) throw badRequest("Chave ElevenLabs não configurada.");
    res.json(await elevenlabsTts(key, text, voice));
    return;
  }
  const key = keys.groq;
  if (!key) throw badRequest("Chave Groq não configurada.");
  res.json(await groqTts(key, text, voice || "troy"));
});

/**
 * POST /api/ai/test — testa as chaves configuradas (todas ou uma, via {id}).
 * Não altera cooldowns; pode correr-se as vezes que se quiser.
 */
aiRouter.post("/test", validate(aiTestSchema), async (req, res) => {
  const { id } = req.body as { id?: string };
  const { keys } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  const results = id ? [await testOneProvider(id, keys)] : await testAllProviders(keys);
  const ok = results.filter((r) => r.ok).length;
  const withKey = results.filter((r) => r.status !== "sem-chave").length;
  res.json({ ok, tested: results.length, withKey, results });
});

/**
 * GET /api/ai/discover — diagnóstico rigoroso: para cada provider, testa a base
 * (GET /models) e lista modelos disponíveis. Ajuda a garantir que cada chave está
 * a ser usada no endpoint certo (e a corrigir via AI_BASE_ / AI_MODEL_ sem redeploy).
 */
aiRouter.get("/discover", async (req, res) => {
  const { keys } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  const out = [];
  for (const p of getRegistry()) {
    const key = keys[p.id] || "";
    if (!key) {
      out.push({ id: p.id, base: p.base ?? null, hasKey: false, hasModels: false, models: [] });
      continue;
    }
    const d = await probeProvider(p, key);
    out.push({ id: p.id, base: d.base, hasKey: true, hasModels: d.hasModels, models: d.models });
  }
  res.json({ providers: out });
});

/** GET /api/ai/rag — estado da base de conhecimento semântica (chunks por origem) */
aiRouter.get("/rag", async (_req, res) => {
  res.json(await ragStats());
});

/**
 * GET /api/ai/status — diagnóstico (chaves globais + nomes de env de IA presentes, sem valores).
 */
aiRouter.get("/status", (_req, res) => {
  const AI_ENV_PATTERN =
    /(GROQ|GEMINI|GOOGLE|MISTRAL|CEREBRAS|NVIDIA|OPENROUTER|OPENAI|ANTHROPIC|ELEVENLABS)/i;
  const aiEnvNames = Object.keys(process.env)
    .filter((k) => AI_ENV_PATTERN.test(k) && /KEY|TOKEN|SECRET/i.test(k))
    .sort();
  res.json({ globalKeys: Object.keys(globalAiKeys), aiEnvNames });
});
