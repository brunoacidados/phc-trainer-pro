/**
 * Registo de fornecedores de IA.
 * Junta: (1) os 6 "majors" do conteúdo estático, (2) providers GENÉRICOS
 * auto-detetados a partir de variáveis de ambiente `<PREFIXO>_API_KEY[_SUFIXO]`
 * (OpenAI-compatible), e (3) o fallback Bynara (chave em código, rodável diariamente
 * via env BYNARA_API_KEY — o "sítio único" para trocar).
 *
 * Para providers genéricos, a base URL e o modelo podem ser fixados por env sem
 * redeploy:  AI_BASE_<NOME_COMPLETO>  e  AI_MODEL_<NOME_COMPLETO>
 * (ex.: AI_BASE_DEEPSEEK_API_KEY_FLASH, AI_MODEL_DEEPSEEK_API_KEY_FLASH).
 * Sem isso, a base é inferida e o modelo é DESCOBERTO via GET <base>/models.
 */
import { AI_PROVIDERS, type AiProviderDef } from "@phc/content";

export interface Provider extends AiProviderDef {
  /** base URL sem /chat/completions (para discovery /models) */
  base?: string;
  /** true se veio de env genérico (não é major) */
  custom?: boolean;
  /** nome da variável de env que contém a chave (p/ providers de env) */
  envName?: string;
}

/** Fallback final (router OpenAI-compatible). Chave em código; troque diariamente
 *  definindo BYNARA_API_KEY no Render (esse é o único sítio que precisa mudar). */
export const BYNARA_ID = "bynara";
export const BYNARA_BASE = process.env.BYNARA_BASE_URL || "https://router.bynara.id/v1";
export const BYNARA_MODEL = process.env.BYNARA_MODEL || "deepseek-v4-pro";
// Chave exposta de propósito (o utilizador roda-a diariamente); env tem precedência.
export const BYNARA_FALLBACK_KEY =
  process.env.BYNARA_API_KEY || "sk-nry-8AAGP3kWIG3krMuWgioFdFbMT4kc_hiMU_8-g0LVRr8";

const MAJOR_IDS = new Set(["groq", "gemini", "mistral", "cerebras", "nvidia", "openrouter"]);

function baseOfUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "");
}

/** infere base URL para um provider genérico a partir do nome */
function guessBase(prefix: string): string {
  const p = prefix.toUpperCase();
  if (p.includes("DEEPSEEK")) return "https://api.deepseek.com/v1";
  // por omissão, agregadores/resellers deste projeto falam com o router bynara
  return BYNARA_BASE;
}

/** descobre providers genéricos a partir de env: `<PREFIXO>_API_KEY[_SUFIXO]` */
function customFromEnv(): Provider[] {
  const out: Provider[] = [];
  const re = /^([A-Z][A-Z0-9]*)_API_KEY(?:_([A-Z0-9]+))?$/;
  for (const name of Object.keys(process.env)) {
    const m = name.match(re);
    if (!m) continue;
    const prefix = m[1];
    const suffix = m[2];
    const key = (process.env[name] || "").trim();
    if (!key) continue;
    if (MAJOR_IDS.has(prefix.toLowerCase())) continue; // majors já tratados por AI_KEY_*/aliases
    if (prefix.toLowerCase() === BYNARA_ID) continue; // bynara é built-in
    const id = `${prefix.toLowerCase()}${suffix ? "_" + suffix.toLowerCase() : ""}`;
    const base = (process.env[`AI_BASE_${name}`] || guessBase(prefix)).replace(/\/$/, "");
    const model = process.env[`AI_MODEL_${name}`] || undefined;
    out.push({
      id,
      nome: `${prefix}${suffix ? " " + suffix : ""} (env)`,
      type: "openai",
      url: base + "/chat/completions",
      base,
      model: model ?? null,
      codeModel: null,
      custom: true,
      envName: name,
    });
  }
  return out;
}

let registry: Provider[] | null = null;

export function getRegistry(): Provider[] {
  if (registry) return registry;
  const majors: Provider[] = AI_PROVIDERS.map((p) => ({ ...p, base: baseOfUrl(p.url) }));
  const bynara: Provider = {
    id: BYNARA_ID,
    nome: "Bynara router (fallback)",
    type: "openai",
    url: BYNARA_BASE + "/chat/completions",
    base: BYNARA_BASE,
    model: BYNARA_MODEL,
    codeModel: null,
  };
  registry = [...majors, ...customFromEnv(), bynara];
  return registry;
}

export function getProvider(id: string): Provider | undefined {
  return getRegistry().find((p) => p.id === id);
}

/**
 * Mapa de chaves vindas de env para providers de env (custom) + fallback Bynara.
 * Os majors usam globalAiKeys (aliases AI_KEY_); team keys têm precedência no router.
 */
export function envKeysMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of getRegistry()) {
    if (p.envName) {
      const v = process.env[p.envName];
      if (v && v.trim()) out[p.id] = v.trim();
    }
  }
  if (!out[BYNARA_ID]) out[BYNARA_ID] = BYNARA_FALLBACK_KEY;
  return out;
}

/** ordem por omissão: majors rápidos → customs → bynara SEMPRE último */
export function defaultOrder(): string[] {
  const majors = ["groq", "gemini", "nvidia", "mistral", "cerebras", "openrouter"];
  const customs = getRegistry().filter((p) => p.custom).map((p) => p.id);
  return [...majors, ...customs, BYNARA_ID];
}

/* ---------- descoberta de modelos (GET <base>/models) ---------- */
const modelCache = new Map<string, string[]>();

export async function discoverModels(p: Provider, key: string): Promise<string[]> {
  if (!p.base) return [];
  const ck = p.id;
  if (modelCache.has(ck)) return modelCache.get(ck)!;
  try {
    const r = await fetch(p.base.replace(/\/$/, "") + "/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { data?: { id?: string }[]; models?: { id?: string }[] };
    const list = (j.data ?? j.models ?? []).map((x: { id?: string }) => x.id || "").filter(Boolean);
    modelCache.set(ck, list);
    return list;
  } catch {
    return [];
  }
}

/** escolhe o melhor modelo disponível para um provider (descobre se necessário) */
export async function resolveModel(p: Provider, key: string, code: boolean): Promise<string | null> {
  if (code && p.codeModel) return p.codeModel;
  if (p.model) return p.model;
  if (p.id === "openrouter") return process.env.AI_MODEL_OPENROUTER || "openai/gpt-4o-mini";
  // genérico sem modelo fixo: descobre e prefere deepseek/pro, senão o 1º
  const models = await discoverModels(p, key);
  if (!models.length) return "deepseek-v4-pro";
  const pref = models.find((m) => /deepseek/i.test(m) && /pro/i.test(m));
  return pref || models.find((m) => /deepseek/i.test(m)) || models[0];
}

/** diagnóstico: testa base+/models de um provider com a chave dada */
export async function probeProvider(p: Provider, key: string) {
  const models = await discoverModels(p, key);
  return { id: p.id, base: p.base ?? null, models: models.slice(0, 12), hasModels: models.length > 0 };
}
