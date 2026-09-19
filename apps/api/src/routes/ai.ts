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
} from "@phc/shared";
import { labById, theoryFor } from "@phc/content";
import { badRequest } from "../lib/errors.ts";
import { Team } from "../models/Team.ts";
import { getOrCreateProgress } from "../models/Progress.ts";
import { requireUser, validate } from "../middleware/auth.ts";
import {
  routeChat,
  providersStatus,
  testAllProviders,
  testOneProvider,
  DEFAULT_ORDER,
} from "../services/aiRouter.ts";
import { resolveTeamKeys } from "./teams.ts";
import { elevenlabsTts, geminiTts, groqTts } from "../services/tts.ts";
import { globalAiKeys } from "../config/env.ts";

export const aiRouter = Router();
aiRouter.use(requireUser);

async function resolveKeysAndOrder(teamId: string | null, userId: string) {
  const team = teamId ? await Team.findById(teamId) : null;
  const keys = resolveTeamKeys(team);
  return {
    keys,
    order: team?.aiOrder?.length ? team.aiOrder : DEFAULT_ORDER,
    scope: team ? `team:${team._id}` : `user:${userId}`,
  };
}

/** GET /api/ai/providers — estado dos fornecedores (configurado? origem? pausa?) */
aiRouter.get("/providers", async (req, res) => {
  const { keys, scope } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  res.json({ providers: providersStatus(keys, scope) });
});

/**
 * POST /api/ai/chat — tutor de IA com auto-router no servidor.
 * Se a primeira mensagem não for system, o servidor injeta a persona do
 * Professor Einstein + contexto da empresa/país/gama do aluno + missão (labId).
 */
aiRouter.post("/chat", validate(aiChatRequestSchema), async (req, res) => {
  const { messages, maxTokens, code, kind, labId } = req.body as ReturnType<
    typeof aiChatRequestSchema.parse
  >;
  if (!messages.length) throw badRequest("Mensagens vazias.");

  const progress = await getOrCreateProgress(req.auth!.sub);
  if (progress.state.settings.economy && kind !== "generate") {
    throw badRequest("Modo económico ativo — a IA está desligada para este aluno (Definições).");
  }

  const finalMessages = [...messages];
  if (finalMessages[0]?.role !== "system") {
    let sys = buildSystemPrompt(contextFromProgress(progress.state));
    if (labId) {
      const lab = labById(labId);
      if (lab) sys += "\n\n" + missionContext(lab, theoryFor(labId));
    }
    // mini-RAG da Enciclopédia + regras SQL (como no legado v5.x)
    const lastUser = [...finalMessages].reverse().find((m) => m.role === "user")?.content ?? "";
    const enc = encContext(lastUser);
    if (enc) sys += "\n\n" + enc;
    if (/\bsql\b|select\s|query|consulta|tabela|campos?\b|base de dados/i.test(lastUser)) {
      sys += "\n\n" + SQL_RULES + "\n\n" + schemaContext(lastUser, progress.state.dbSchema);
    }
    if (kind === "chat") {
      sys +=
        "\n\nResponda em no máximo 180 palavras. Use SEMPRE a EMPRESA EM FOCO do contexto como exemplo, em linguagem simples e profissional.";
    }
    finalMessages.unshift({ role: "system", content: sys });
  }

  const { keys, order, scope } = await resolveKeysAndOrder(req.auth!.teamId, req.auth!.sub);
  const out = await routeChat({ scope, keys, order, messages: finalMessages, maxTokens, code });

  // métricas leves no progresso (xp de chats)
  progress.state.stats.chats = (progress.state.stats.chats || 0) + 1;
  progress.markModified("state");
  await progress.save().catch(() => undefined);

  res.json({ text: out.text, provider: out.provider, cached: false });
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
 * Pede "responda OK" a cada fornecedor e devolve ok/latência/erro por fornecedor.
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
 * GET /api/ai/status — diagnóstico.
 * Devolve: chaves globais ativas (ids) + nomes (NUNCA valores) das variáveis de
 * ambiente presentes no servidor que parecem chaves de IA — para diagnosticar
 * nomes errados no Render/Vercel.
 */
aiRouter.get("/status", (_req, res) => {
  const AI_ENV_PATTERN = /(GROQ|GEMINI|GOOGLE|MISTRAL|CEREBRAS|NVIDIA|OPENROUTER|OPENAI|ANTHROPIC|ELEVENLABS)/i;
  const aiEnvNames = Object.keys(process.env)
    .filter((k) => AI_ENV_PATTERN.test(k) && /KEY|TOKEN|SECRET/i.test(k))
    .sort();
  res.json({ globalKeys: Object.keys(globalAiKeys), aiEnvNames });
});
