/**
 * RAG (Retrieval-Augmented Generation) por busca semântica.
 * Os chunks (conteúdo embeddado) vivem no Mongo; em runtime carregamos os
 * vetores para memória e fazemos cosseno "brute-force" — rápido o suficiente
 * para ~milhares de chunks e funciona em QUALQUER Mongo (incl. Atlas M0 free),
 * sem exigir Vector Search index. (Upgrade p/ Atlas Vector Search é transparente.)
 */
import { Chunk } from "../models/Chunk.ts";
import { embedQuery } from "./embeddings.ts";

interface MemChunk {
  source: string;
  refId: string;
  title: string;
  text: string;
  vector: number[];
}

let cache: MemChunk[] | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 10 * 60_000; // recarrega no máx. a cada 10 min (apanha re-seeds)

export function invalidateRagCache(): void {
  cache = null;
  cacheAt = 0;
}

async function ensureLoaded(): Promise<MemChunk[]> {
  if (cache && Date.now() - cacheAt < CACHE_TTL_MS) return cache;
  const docs = await Chunk.find({}, { source: 1, refId: 1, title: 1, text: 1, vector: 1 }).lean();
  cache = docs
    .filter((d) => Array.isArray(d.vector) && d.vector.length > 0)
    .map((d) => ({
      source: String(d.source),
      refId: String(d.refId),
      title: String(d.title),
      text: String(d.text),
      vector: d.vector as number[],
    }));
  cacheAt = Date.now();
  return cache;
}

export interface RagHit {
  source: string;
  refId: string;
  title: string;
  text: string;
  score: number;
}

/** produto escalar de vetores normalizados == similaridade de cosseno */
function dot(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

/**
 * Busca semântica: devolve os top-k chunks mais parecidos com a query.
 * Devolve [] se não houver chunks embeddados ou sem chave de embeddings
 * (o chamador faz fallback para o mini-RAG por palavras-chave).
 */
export async function semanticSearch(
  query: string,
  keys: Record<string, string>,
  k = 5,
  threshold = 0.3,
): Promise<RagHit[]> {
  const chunks = await ensureLoaded();
  if (!chunks.length) return [];
  const qv = await embedQuery(query, keys);
  if (!qv) return [];
  const scored = chunks.map((c) => ({ ...c, score: dot(qv, c.vector) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter((c) => c.score >= threshold);
}

/** formata os hits como bloco de contexto para injetar no prompt */
export function ragContextBlock(hits: RagHit[]): string {
  if (!hits.length) return "";
  const lines = hits.map(
    (h) => `- [${h.source}${h.refId ? " · " + h.refId : ""}] ${h.title}: ${h.text.slice(0, 400)}`,
  );
  return (
    "REFERÊNCIAS DA BASE DE CONHECIMENTO PHC (busca semântica — use se relevante e cite como 'Enciclopédia PHC'):\n" +
    lines.join("\n")
  );
}

export async function ragStats(): Promise<{ chunks: number; sources: Record<string, number> }> {
  const chunks = await ensureLoaded();
  const sources: Record<string, number> = {};
  for (const c of chunks) sources[c.source] = (sources[c.source] ?? 0) + 1;
  return { chunks: chunks.length, sources };
}
