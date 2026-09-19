import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/phc-trainer"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-only-access-secret-0123456789"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-only-refresh-secret-0123456789"),
  ENCRYPTION_KEY: z.string().min(16).default("dev-only-encryption-key-0123456789"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ACCESS_TTL: z.string().default("15m"),
  REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  SENTRY_DSN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("PHC Trainer Pro <onboarding@resend.dev>"),
  ADMIN_EMAIL: z.string().optional(),
  APP_URL: z.string().default("http://localhost:5173"),
  REQUIRE_EMAIL_VERIFICATION: z.coerce.boolean().default(false),
  AI_KEY_GROQ: z.string().optional(),
  AI_KEY_GEMINI: z.string().optional(),
  AI_KEY_MISTRAL: z.string().optional(),
  AI_KEY_CEREBRAS: z.string().optional(),
  AI_KEY_NVIDIA: z.string().optional(),
  AI_KEY_OPENROUTER: z.string().optional(),
  AI_MODEL_OPENROUTER: z.string().default("openai/gpt-4o-mini"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

if (isProd) {
  const devDefaults = [
    env.JWT_ACCESS_SECRET.startsWith("dev-only"),
    env.JWT_REFRESH_SECRET.startsWith("dev-only"),
    env.ENCRYPTION_KEY.startsWith("dev-only"),
  ];
  if (devDefaults.some(Boolean)) {
    throw new Error(
      "Em produção, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET e ENCRYPTION_KEY têm de ser definidos (ver .env.example).",
    );
  }
}

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Chaves de IA globais (fallback), por fornecedor.
 * Aceita VÁRIOS nomes de variável de ambiente por fornecedor — use o que preferir:
 *   groq:      AI_KEY_GROQ      | GROQ_API_KEY
 *   gemini:    AI_KEY_GEMINI    | GEMINI_API_KEY | GOOGLE_API_KEY | GOOGLE_GENAI_API_KEY
 *   mistral:   AI_KEY_MISTRAL   | MISTRAL_API_KEY
 *   cerebras:  AI_KEY_CEREBRAS  | CEREBRAS_API_KEY
 *   nvidia:    AI_KEY_NVIDIA    | NVIDIA_API_KEY
 *   openrouter:AI_KEY_OPENROUTER| OPENROUTER_API_KEY
 * (Lê diretamente de process.env para aceitar todos os alias sem os declarar no schema.)
 */
const KEY_ALIASES: Record<string, string[]> = {
  groq: ["AI_KEY_GROQ", "GROQ_API_KEY", "GROQ_KEY"],
  gemini: [
    "AI_KEY_GEMINI",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_GENAI_API_KEY",
    "GOOGLE_GEN_AI_API_KEY",
    "GEMINI_KEY",
  ],
  mistral: ["AI_KEY_MISTRAL", "MISTRAL_API_KEY", "MISTRAL_KEY"],
  cerebras: ["AI_KEY_CEREBRAS", "CEREBRAS_API_KEY", "CEREBRAS_KEY"],
  nvidia: ["AI_KEY_NVIDIA", "NVIDIA_API_KEY", "NVIDIA_KEY", "NVIDIA_NIM_API_KEY"],
  openrouter: ["AI_KEY_OPENROUTER", "OPENROUTER_API_KEY", "OPENROUTER_KEY"],
};

function firstEnv(names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

export const globalAiKeys: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_ALIASES)
    .map(([provider, names]) => [provider, firstEnv(names)] as [string, string | undefined])
    .filter(([, v]) => !!v) as [string, string][],
);

/** modelo OpenRouter (aceita alias) */
export const openRouterModel =
  firstEnv(["AI_MODEL_OPENROUTER", "OPENROUTER_MODEL", "OPENROUTER_DEFAULT_MODEL"]) ??
  env.AI_MODEL_OPENROUTER;

// diagnóstico no arranque: que chaves de IA (de ambiente) o servidor viu — só os ids, nunca os valores
console.log(
  `[env] chaves de IA via ambiente: ${
    Object.keys(globalAiKeys).length
      ? Object.keys(globalAiKeys).join(", ")
      : "(nenhuma — use AI_KEY_* ou *_API_KEY, ou configure na app em Equipa → Fornecedores de IA)"
  }`,
);
