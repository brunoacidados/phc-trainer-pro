/**
 * Auto-router de IA no servidor (multi-fornecedor, com fallback).
 * - Providers: 6 "majors" + genéricos auto-detetados por env + Bynara (último).
 * - Backoff exponencial em 429 e circuit-breaker por falhas consecutivas:
 *   não martela fornecedores limitados/quebrados (protege limites e respostas).
 * - Streaming SSE com fallback apenas ANTES do 1º token.
 */
import { globalAiKeys } from "../config/env.ts";
import { ApiError } from "../lib/errors.ts";
import {
  BYNARA_FALLBACK_KEY,
  BYNARA_ID,
  defaultOrder,
  getProvider,
  getRegistry,
  resolveModel,
  type Provider,
} from "./providers.ts";

/** preferência para geração de código (modelos fortes a código primeiro) */
const CODE_PREF = ["mistral", "nvidia", "openrouter"];

interface Cooldown {
  until: number;
  st: number;
}
const cooldowns = new Map<string, Cooldown>();
const failStreak = new Map<string, number>();

function cdKey(scope: string, id: string) {
  return `${scope}:${id}`;
}
function isHealthy(scope: string, id: string): boolean {
  const c = cooldowns.get(cdKey(scope, id));
  return !(c && c.until > Date.now());
}
const CAP_MS = 60 * 60_000;
function markFail(scope: string, id: string, status: number): void {
  const k = cdKey(scope, id);
  const streak = (failStreak.get(id) ?? 0) + 1;
  failStreak.set(id, streak);
  let cd: number;
  if (status === 401 || status === 402 || status === 403) cd = 3 * 3600_000;
  else if (status === 429) cd = Math.min(CAP_MS, 3 * 60_000 * 2 ** (streak - 1)); // backoff exponencial
  else cd = Math.min(10 * 60_000, 90_000 * streak);
  if (streak >= 4) cd = Math.max(cd, 30 * 60_000); // circuit-breaker
  cooldowns.set(k, { until: Date.now() + cd, st: status });
}
function markOk(scope: string, id: string): void {
  cooldowns.delete(cdKey(scope, id));
  failStreak.delete(id);
}

export interface RouterInput {
  scope: string;
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
  const registryIds = new Set(getRegistry().map((p) => p.id));
  let base = input.order?.length ? input.order.filter((x) => registryIds.has(x)) : defaultOrder();
  if (input.code) {
    const head = CODE_PREF.filter((x) => base.includes(x));
    base = [...head, ...base.filter((x) => !head.includes(x))];
  }
  // Bynara SEMPRE último (fallback de último recurso)
  base = [...base.filter((x) => x !== BYNARA_ID), BYNARA_ID];
  return base;
}

function keyFor(input: RouterInput, id: string): string {
  return (input.keys[id] || globalAiKeys[id] || "").trim();
}

function buildRequest(
  def: Provider,
  key: string,
  messages: RouterInput["messages"],
  maxTokens: number,
  stream: boolean,
  model: string,
): { url: string; init: RequestInit } {
  if (def.type === "gemini") {
    const sys: string[] = [];
    const turns: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    for (const m of messages) {
      if (m.role === "system") sys.push(m.content);
      else turns.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content) }] });
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
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  if (def.id === "openrouter") {
    headers["HTTP-Referer"] = "https://github.com/brunoacidados/phc-trainer-pro";
    headers["X-Title"] = "PHC Trainer Pro";
  }
  const mt = def.id === "groq" ? Math.max(2048, maxTokens * 2) : maxTokens;
  const payload: Record<string, unknown> = { model, messages, max_tokens: mt, temperature: 0.7 };
  if (stream) payload.stream = true;
  return { url: def.url!, init: { method: "POST", headers, body: JSON.stringify(payload) } };
}

function parseDelta(def: Provider, dataLine: string): string {
  if (dataLine === "[DONE]") return "";
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(dataLine);
  } catch {
    return "";
  }
  if (def.type === "gemini") {
    const parts = (j.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined)?.[0]?.content?.parts;
    return parts ? parts.map((p) => p.text || "").join("") : "";
  }
  const d = (j.choices as { delta?: { content?: string }; message?: { content?: string } }[] | undefined)?.[0];
  return d?.delta?.content ?? d?.message?.content ?? "";
}

async function callProvider(
  def: Provider,
  key: string,
  messages: RouterInput["messages"],
  maxTokens: number,
  code: boolean,
): Promise<string> {
  const model = (await resolveModel(def, key, code)) || "";
  const { url, init } = buildRequest(def, key, messages, maxTokens, false, model);
  const r = await fetch(url, init);
  if (!r.ok) {
    let t = "";
    try {
      t = (await r.text()).slice(0, 150);
    } catch {
      /* ignore */
    }
    throw Object.assign(new Error(`${def.nome} HTTP ${r.status} ${t}`), { status: r.status });
  }
  const j = (await r.json()) as Record<string, unknown>;
  if (def.type === "gemini") {
    const parts = (j.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined)?.[0]?.content?.parts;
    if (!parts?.length) throw Object.assign(new Error(`${def.nome}: sem texto`), { status: 0 });
    return parts.map((p) => p.text || "").join("").trim();
  }
  const ch = (j.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content;
  if (!ch) throw Object.assign(new Error(`${def.nome}: resposta vazia`), { status: 0 });
  return String(ch).trim();
}

async function streamProvider(
  def: Provider,
  key: string,
  messages: RouterInput["messages"],
  maxTokens: number,
  code: boolean,
  onToken: (t: string) => void,
): Promise<string> {
  const model = (await resolveModel(def, key, code)) || "";
  const { url, init } = buildRequest(def, key, messages, maxTokens, true, model);
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function routeChat(input: RouterInput): Promise<RouterResult> {
  const order = orderFor(input);
  const tried: string[] = [];
  let lastErr: Error | null = null;
  const maxTokens = input.maxTokens ?? 900;
  for (const id of order) {
    const def = getProvider(id);
    if (!def) continue;
    const key = keyFor(input, id);
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
    `Todos os fornecedores de IA falharam [${tried.join(", ") || "nenhum configurado"}]. Último erro: ${lastErr?.message ?? "?"}`,
  );
}

export interface StreamInput extends RouterInput {
  onToken: (t: string) => void;
}

export async function routeChatStream(input: StreamInput): Promise<RouterResult> {
  const order = orderFor(input);
  const tried: string[] = [];
  let lastErr: Error | null = null;
  const maxTokens = input.maxTokens ?? 900;
  for (const id of order) {
    const def = getProvider(id);
    if (!def) continue;
    const key = keyFor(input, id);
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

/* ---------- teste / diagnóstico ---------- */
export interface ProviderTestResult {
  id: string;
  nome: string;
  ok: boolean;
  status: "ok" | "sem-chave" | "erro";
  ms?: number;
  httpStatus?: number;
  error?: string;
  model?: string;
}

const TEST_PROMPT = [{ role: "user", content: "Responda apenas com a palavra: OK" }];

export async function testOneProvider(id: string, keys: Record<string, string>): Promise<ProviderTestResult> {
  const def = getProvider(id);
  if (!def) return { id, nome: id, ok: false, status: "erro", error: "fornecedor desconhecido" };
  const key = (keys[id] || globalAiKeys[id] || (id === BYNARA_ID ? BYNARA_FALLBACK_KEY : "")).trim();
  if (!key) return { id, nome: def.nome, ok: false, status: "sem-chave", error: "sem chave configurada" };
  const model = (await resolveModel(def, key, false)) || undefined;
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

export async function testAllProviders(keys: Record<string, string>): Promise<ProviderTestResult[]> {
  const out: ProviderTestResult[] = [];
  for (const p of getRegistry()) out.push(await testOneProvider(p.id, keys));
  return out;
}

export function providersStatus(keys: Record<string, string>, scope: string) {
  return getRegistry().map((p) => {
    const key = keys[p.id] || globalAiKeys[p.id] || (p.id === BYNARA_ID ? "(fallback)" : "");
    const configured = !!key || key === "(fallback)";
    return {
      id: p.id,
      nome: p.nome,
      configured,
      source: keys[p.id] ? "team" : globalAiKeys[p.id] ? "env" : p.id === BYNARA_ID ? "fallback" : "",
      paused: !isHealthy(scope, p.id),
      hint: keys[p.id] ? "****" + String(keys[p.id]).slice(-4) : globalAiKeys[p.id] ? "(global)" : p.id === BYNARA_ID ? "(rodízio)" : undefined,
    };
  });
}

/** visível apenas para testes unitários */
export const __test = { cooldowns, markFail, markOk, isHealthy, failStreak };
