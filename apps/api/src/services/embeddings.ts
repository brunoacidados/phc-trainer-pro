/**
 * Serviço de embeddings para RAG.
 * Fornecedores: Gemini (primário — mesma chave do TTS/texto) e OpenAI-compatible
 * (OpenRouter/OpenAI). Devolve vetores normalizados p/ similaridade de cosseno.
 */
export const EMBED_MODEL_GEMINI = process.env.EMBED_MODEL_GEMINI || "text-embedding-004";
export const EMBED_MODEL_OPENAI = process.env.EMBED_MODEL_OPENAI || "text-embedding-3-small";

export type EmbedProvider = "gemini" | "openai" | null;

/** descobre que fornecedor de embeddings está disponível com as chaves dadas */
export function embedProvider(keys: Record<string, string>): EmbedProvider {
  if (keys.gemini) return "gemini";
  if (keys.openrouter) return "openai";
  return null;
}

/** normaliza (L2) para que produto escalar == cosseno */
function normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

/** embeddings em lote via Gemini (batchEmbedContents, até 100 textos/pedido) */
async function embedGemini(key: string, texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL_GEMINI}:batchEmbedContents`,
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: batch.map((t) => ({
            model: `models/${EMBED_MODEL_GEMINI}`,
            content: { parts: [{ text: t.slice(0, 2048) }] },
          })),
        }),
      },
    );
    if (!r.ok)
      throw new Error(`Gemini embeddings HTTP ${r.status}: ${(await r.text()).slice(0, 150)}`);
    const j = (await r.json()) as { embeddings?: { values: number[] }[] };
    for (const e of j.embeddings ?? []) out.push(normalize(e.values));
  }
  return out;
}

/** embeddings em lote via endpoint OpenAI-compatible (OpenRouter/OpenAI) */
async function embedOpenAI(
  key: string,
  texts: string[],
  baseUrl = "https://openrouter.ai/api/v1",
): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 64) {
    const batch = texts.slice(i, i + 64);
    const r = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBED_MODEL_OPENAI,
        input: batch.map((t) => t.slice(0, 2048)),
      }),
    });
    if (!r.ok)
      throw new Error(`OpenAI embeddings HTTP ${r.status}: ${(await r.text()).slice(0, 150)}`);
    const j = (await r.json()) as { data?: { embedding: number[] }[] };
    for (const d of j.data ?? []) out.push(normalize(d.embedding));
  }
  return out;
}

/** embeddings de vários textos, escolhendo o fornecedor disponível */
export async function embedTexts(
  texts: string[],
  keys: Record<string, string>,
): Promise<number[][]> {
  const prov = embedProvider(keys);
  if (!prov) throw new Error("Sem chave de embeddings (Gemini ou OpenRouter/OpenAI).");
  if (!texts.length) return [];
  if (prov === "gemini") return embedGemini(keys.gemini, texts);
  return embedOpenAI(keys.openrouter, texts);
}

/** embedding de UMA query (para busca em runtime) */
export async function embedQuery(
  text: string,
  keys: Record<string, string>,
): Promise<number[] | null> {
  try {
    const v = await embedTexts([text], keys);
    return v[0] ?? null;
  } catch {
    return null;
  }
}
