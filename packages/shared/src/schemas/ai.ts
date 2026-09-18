/** Contratos do tutor de IA (chat/aulas/gerador + TTS) — router multi-fornecedor no servidor. */
import { z } from "zod";

export const chatRoleSchema = z.enum(["system", "user", "assistant"]);

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().max(60_000),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const aiChatKindSchema = z.enum(["free", "explain", "lesson", "chat", "generate"]);

export const aiChatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(60),
  maxTokens: z.number().int().min(50).max(8000).default(900),
  /** true → prefere modelos de código (glm-5.3/codestral) */
  code: z.boolean().default(false),
  /** se presente, o servidor injeta persona + contexto do aluno + missão */
  kind: aiChatKindSchema.default("free"),
  labId: z
    .string()
    .regex(/^L\d{2}$/)
    .optional(),
});
export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;
/** tipo de entrada (campos com default opcionais) — usar nos clientes */
export type AiChatInput = z.input<typeof aiChatRequestSchema>;
export type TtsInput = z.input<typeof ttsRequestSchema>;

export const aiChatResponseSchema = z.object({
  text: z.string(),
  provider: z.string(),
  cached: z.boolean().default(false),
});
export type AiChatResponse = z.infer<typeof aiChatResponseSchema>;

export const ttsRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  provider: z.enum(["gemini", "elevenlabs", "groq"]).default("gemini"),
  voice: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
});
export type TtsRequest = z.infer<typeof ttsRequestSchema>;

export const ttsResponseSchema = z.object({
  /** áudio em base64 */
  audio: z.string(),
  mimeType: z.string(),
  provider: z.string(),
});
export type TtsResponse = z.infer<typeof ttsResponseSchema>;

/** pedido de teste de fornecedores (id opcional → testa só esse; senão testa todos) */
export const aiTestSchema = z.object({
  id: z.string().min(1).max(40).optional(),
});
export type AiTestRequest = z.infer<typeof aiTestSchema>;

export const providerTestResultSchema = z.object({
  id: z.string(),
  nome: z.string(),
  ok: z.boolean(),
  status: z.enum(["ok", "sem-chave", "erro"]),
  ms: z.number().optional(),
  httpStatus: z.number().optional(),
  error: z.string().optional(),
  model: z.string().optional(),
});
export type ProviderTestResultVM = z.infer<typeof providerTestResultSchema>;
