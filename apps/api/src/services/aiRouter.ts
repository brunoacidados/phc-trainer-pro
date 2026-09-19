/**
 * Auto-router de IA no servidor (porta do router v5.x do legado).
 * Vantagem sobre o navegador: sem problemas de CORS (NVIDIA funciona direta)
 * e chaves guardadas no servidor (equipa) — nunca expostas ao cliente.
 */
import { AI_PROVIDERS, type AiProviderDef } from "@phc/content";
import { globalAiKeys, openRouterModel } from "../config/env.ts";
import { ApiError } from "../lib/errors.ts";

/** ordem por omissão: rápidos primeiro; NVIDIA já funciona direta no servidor */
export const DEFAULT_ORDER = ["groq", "gemini", "nvidia", "mistral", "cerebras", "openrouter"];
/** preferência para geração de código (v5.3: GLM prioritário) */
const CODE_PREF = ["nvidia", "mistral"];

interface Cooldown {
  until: number;
  st: number;
}

/** cooldowns por âmbito (equipa/utilizador) + fornecedor */
const cooldowns = new Map<string, Cooldown>();

function cdKey(scope: string, id: string): string {
  return `${scope}:${id}`;
}

function isHealthy(scope: string, id: string): boolean {
  const c = cooldowns.get(cdKey(scope, id));
  return !(c && c.until > Date.now());
}

function markFail(scope: string, id: string, status: number): void {
  const cd =
    status === 402 || status === 401 || status === 403
      ? 3 * 3600_000
      : status === 429
        ? 3 * 60_000
        : 90_000;
  cooldowns.set(cdKey(scope, id), { until: Date.now() + cd, st: status });
}

function markOk(scope: string, id: string): void {
  cooldowns.delete(cdKey(scope, id));
}

export interface RouterInput {
  /** âmbito para cooldowns (ex.: team:<id> ou user:<id>) */
  scope: string;
  /** chaves resolvidas (equipa → env), por fornecedor */
  keys: Record<string, string>;
  order?: string[];
  messages: { role: string; content: string }[];
  maxTokens?: number;
  code?: boolean;
}

export interface RouterResult {
  text: string;
  provider: string;
}

function orderFor(input: RouterInput): string[] {
  const base = input.order?.length ? [...input.order] : [...DEFAULT_ORDER];
  if (input.code) {
    const head = CODE_PREF.filter((x) => base.includes(x));
    const tail = base.filter((x) => !head.includes(x));
    return [...head, ...tail];
  }
  return base;
}

async function callProvider(
  def: AiProviderDef,
  key: string,
  messages: RouterInput["messages"],
  maxTokens: number,
  code: boolean,
): Promise<string> {
  let model = def.model;
  if (def.id === "openrouter") model = openRouterModel;
  if (code && def.codeModel) model = def.codeModel;
  if (!model) throw Object.assign(new Error(`${def.nome}: sem modelo`), { status: 0 });

  let r: globalThis.Response;
  if (def.type === "gemini") {
    const sys: string[] = [];
    const turns: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    for (const m of messages) {
      if (m.role === "system") sys.push(m.content);
      else
        turns.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content) }],
        });
    }
    const body: Record<string, unknown> = {
      contents: turns,
      generationConfig: { maxOutputTokens: Math.max(1024, maxTokens * 2), temperature: 0.7 },
    };
    if (sys.length) body.systemInstruction = { parts: [{ text: sys.join("\n") }] };
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  } else {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
    if (def.id === "openrouter") {
      headers["HTTP-Referer"] = "https://github.com/brunoacidados/phc-trainer-pro";
      headers["X-Title"] = "PHC Trainer Pro";
    }
    const mt = def.id === "groq" ? Math.max(2048, maxTokens * 2) : maxTokens;
    r = await fetch(def.url!, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, max_tokens: mt, temperature: 0.7 }),
    });
  }

  if (!r.ok) {
    let t = "";
    try {
      t = (await r.text()).slice(0, 150);
    } catch {
      /* ignora */
    }
    throw Object.assign(new Error(`${def.nome} HTTP ${r.status} ${t}`), { status: r.status });
  }

  const j = (await r.json()) as Record<string, unknown>;
  if (def.type === "gemini") {
    const c = (j.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined)?.[0];
    const parts = c?.content?.parts;
    if (!parts?.length) throw Object.assign(new Error(`${def.nome}: sem texto`), { status: 0 });
    return parts
      .map((p) => p.text || "")
      .join("")
      .trim();
  }
  const ch = (j.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content;
  if (!ch) throw Object.assign(new Error(`${def.nome}: resposta vazia`), { status: 0 });
  return String(ch).trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function routeChat(input: RouterInput): Promise<RouterResult> {
  const order = orderFor(input);
  const tried: string[] = [];
  let lastErr: Error | null = null;
  const maxTokens = input.maxTokens ?? 900;

  for (const id of order) {
    const def = AI_PROVIDERS.find((p) => p.id === id);
    if (!def) continue;
    const key = (input.keys[id] || "").trim();
    if (!key) {
      tried.push(`${id}(sem chave)`);
      continue;
    }
    if (!isHealthy(input.scope, id)) {
      tried.push(`${id}(em pausa)`);
      continue;
    }
    try {
      const text = await callProvider(def, key, input.messages, maxTokens, !!input.code);
      if (!text) throw Object.assign(new Error("vazio"), { status: 0 });
      markOk(input.scope, id);
      return { text, provider: id };
    } catch (e) {
      let st = (e as { status?: number }).status || 0;
      let err = e as Error;
      if (st === 429) {
        await sleep(1600);
        try {
          const text = await callProvider(def, key, input.messages, maxTokens, !!input.code);
          markOk(input.scope, id);
          return { text, provider: id };
        } catch (e2) {
          st = (e2 as { status?: number }).status || 0;
          err = e2 as Error;
        }
      }
      markFail(input.scope, id, st || 599);
      lastErr = err;
      tried.push(`${id}(${st || "rede"})`);
    }
  }

  throw new ApiError(
    502,
    `Todos os fornecedores de IA falharam [${tried.join(", ") || "nenhum configurado"}]. ` +
      "Configure as chaves da equipa em Definições → IA. Último erro: " +
      (lastErr?.message ?? "?"),
  );
}

/** estado dos fornecedores para a UI (configurado? em pausa? origem da chave) */
export function providersStatus(keys: Record<string, string>, scope: string) {
  return AI_PROVIDERS.map((p) => {
    const key = keys[p.id] || "";
    const fromEnv = !key && !!globalAiKeys[p.id];
    return {
      id: p.id,
      nome: p.nome,
      configured: !!key || fromEnv,
      source: key ? "team" : fromEnv ? "env" : "",
      paused: !isHealthy(scope, p.id),
      hint: key ? "****" + key.slice(-4) : fromEnv ? "(global)" : undefined,
    };
  });
}

/* ---------- streaming (SSE) ---------- */

function modelFor(def: AiProviderDef, code: boolean): string | null {
  let model = def.model;
  if (def.id === "openrouter") model = openRouterModel;
  if (code && def.codeModel) model = def.codeModel;
  return model;
}

/** constrói o pedido HTTP (url/headers/body) para um fornecedor — partilhado por call/stream */
function buildRequest(
  def: AiProviderDef,
  key: string,
  messages: RouterInput["messages"],
  maxTokens: number,
  code: boolean,
  stream: boolean,
): { url: string; init: RequestInit } {
  const model = modelFor(def, code);
  if (!model) throw Object.assign(new Error(`${def.nome}: sem modelo`), { status: 0 });
  if (def.type === "gemini") {
    const sys: string[] = [];
    const turns: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    for (const m of messages) {
      if (m.role === "system") sys.push(m.content);
      else
        turns.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content) }],
        });
    }
    const body: Record<string, unknown> = {
      contents: turns,
      generationConfig: { maxOutputTokens: Math.max(1024, maxTokens * 2), temperature: 0.7 },
    };
    if (sys.length) body.systemInstruction = { parts: [{ text: sys.join("\n") }] };
    const url = stream
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!stream) headers["x-goog-api-key"] = key;
    return { url, init: { method: "POST", headers, body: JSON.stringify(body) } };
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (def.id === "openrouter") {
    headers["HTTP-Referer"] = "https://github.com/brunoacidados/phc-trainer-pro";
    headers["X-Title"] = "PHC Trainer Pro";
  }
  const mt = def.id === "groq" ? Math.max(2048, maxTokens * 2) : maxTokens;
  const payload: Record<string, unknown> = { model, messages, max_tokens: mt, temperature: 0.7 };
  if (stream) payload.stream = true;
  return { url: def.url!, init: { method: "POST", headers, body: JSON.stringify(payload) } };
}

/** extrai o delta de texto de um evento SSE conforme o formato do fornecedor */
function parseDelta(def: AiProviderDef, dataLine: string): string {
  if (dataLine === "[DONE]") return "";
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(dataLine);
  } catch {
    return "";
  }
  if (def.type === "gemini") {
    const parts = (j.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined)?.[0]
      ?.content?.parts;
    return parts ? parts.map((p) => p.text || "").join("") : "";
  }
  const delta = (
    j.choices as { delta?: { content?: string }; message?: { content?: string } }[] | undefined
  )?.[0];
  return delta?.delta?.content ?? delta?.message?.content ?? "";
}

/**
 * Faz stream de UM fornecedor, chamando onToken por delta. Devolve o texto completo.
 * Lança erro (com .status) se a ligação falhar.
 */
async function streamProvider(
  def: AiProviderDef,
  key: string,
  messages: RouterInput["messages"],
  maxTokens: number,
  code: boolean,
  onToken: (t: string) => void,
): Promise<string> {
  const { url, init } = buildRequest(def, key, messages, maxTokens, code, true);
  const r = await fetch(url, init);
  if (!r.ok || !r.body) {
    let t = "";
    try {
      t = (await r.text()).slice(0, 150);
    } catch {
      /* ignore */
    }
    throw Object.assign(new Error(`${def.nome} HTTP ${r.status} ${t}`), { status: r.status });
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const chunk = parseDelta(def, line.slice(5).trim());
      if (chunk) {
        full += chunk;
        onToken(chunk);
      }
    }
  }
  if (!full.trim()) throw Object.assign(new Error(`${def.nome}: stream vazio`), { status: 0 });
  return full;
}

export interface StreamInput extends RouterInput {
  onToken: (t: string) => void;
}

/**
 * Router com streaming: tenta fornecedores por ordem; se um falhar ANTES de
 * emitir qualquer token, avança para o seguinte. Depois de começar a emitir,
 * compromete-se com esse fornecedor (não há fallback a meio do stream).
 */
export async function routeChatStream(input: StreamInput): Promise<RouterResult> {
  const order = orderFor(input);
  const tried: string[] = [];
  let lastErr: Error | null = null;
  const maxTokens = input.maxTokens ?? 900;
  for (const id of order) {
    const def = AI_PROVIDERS.find((p) => p.id === id);
    if (!def) continue;
    const key = (input.keys[id] || "").trim();
    if (!key) {
      tried.push(`${id}(sem chave)`);
      continue;
    }
    if (!isHealthy(input.scope, id)) {
      tried.push(`${id}(em pausa)`);
      continue;
    }
    let emitted = false;
    try {
      const text = await streamProvider(def, key, input.messages, maxTokens, !!input.code, (t) => {
        emitted = true;
        input.onToken(t);
      });
      markOk(input.scope, id);
      return { text, provider: id };
    } catch (e) {
      const st = (e as { status?: number }).status || 0;
      // se já emitiu tokens, não vale a pena tentar outro (o cliente já recebeu parte)
      if (emitted) {
        markFail(input.scope, id, st || 599);
        throw e as Error;
      }
      markFail(input.scope, id, st || 599);
      lastErr = e as Error;
      tried.push(`${id}(${st || "rede"})`);
    }
  }
  throw new ApiError(
    502,
    `Todos os fornecedores de IA falharam [${tried.join(", ") || "nenhum configurado"}]. Último erro: ${lastErr?.message ?? "?"}`,
  );
}

/* ---------- teste de fornecedores (diagnóstico, sem efeitos em cooldowns) ---------- */

export interface ProviderTestResult {
  id: string;
  nome: string;
  ok: boolean;
  /** "ok" | "sem-chave" | "erro" */
  status: "ok" | "sem-chave" | "erro";
  ms?: number;
  httpStatus?: number;
  error?: string;
  model?: string;
}

const TEST_PROMPT = [{ role: "user", content: "Responda apenas com a palavra: OK" }];

/** testa UM fornecedor com um pedido mínimo; devolve ok/latência/erro. Não altera cooldowns. */
export async function testOneProvider(
  id: string,
  keys: Record<string, string>,
): Promise<ProviderTestResult> {
  const def = AI_PROVIDERS.find((p) => p.id === id);
  if (!def) return { id, nome: id, ok: false, status: "erro", error: "fornecedor desconhecido" };
  const key = (keys[id] || globalAiKeys[id] || "").trim();
  if (!key)
    return { id, nome: def.nome, ok: false, status: "sem-chave", error: "sem chave configurada" };
  const model = def.id === "openrouter" ? openRouterModel : (def.model ?? undefined);
  const t0 = Date.now();
  try {
    const text = await callProvider(def, key, TEST_PROMPT, 60, false);
    return { id, nome: def.nome, ok: !!text, status: "ok", ms: Date.now() - t0, model };
  } catch (e) {
    return {
      id,
      nome: def.nome,
      ok: false,
      status: "erro",
      ms: Date.now() - t0,
      httpStatus: (e as { status?: number }).status || undefined,
      error: String((e as Error).message || e).slice(0, 140),
      model,
    };
  }
}

/** testa todos os fornecedores (sequencial, para não disparar rate limits) */
export async function testAllProviders(
  keys: Record<string, string>,
): Promise<ProviderTestResult[]> {
  const out: ProviderTestResult[] = [];
  for (const p of AI_PROVIDERS) out.push(await testOneProvider(p.id, keys));
  return out;
}

/** visível apenas para testes unitários */
export const __test = { cooldowns, markFail, markOk, isHealthy };
