/**
 * Seed de RAG: constrói chunks a partir de @phc/content, gera embeddings
 * (Gemini ou OpenRouter/OpenAI) e faz upsert na coleção `chunks`.
 *
 * Uso:
 *   MONGODB_URI=... GEMINI_API_KEY=... pnpm --filter @phc/api rag:seed
 *   (aceita também AI_KEY_GEMINI / OPENROUTER_API_KEY / AI_KEY_OPENROUTER)
 *
 * Idempotente: pode correr várias vezes (upsert por source+refId).
 */
import "dotenv/config";
import mongoose from "mongoose";
import { CIRCUITS, ENCYCLOPEDIA, GLOSSARY, LABS, PHC_SCHEMA, THEORY } from "@phc/content";
import { Chunk } from "../src/models/Chunk.ts";
import {
  embedTexts,
  embedProvider,
  EMBED_MODEL_GEMINI,
  EMBED_MODEL_OPENAI,
} from "../src/services/embeddings.ts";
import { invalidateRagCache } from "../src/services/rag.ts";

interface Raw {
  source: string;
  refId: string;
  title: string;
  text: string;
}

function key(pick: string[]): string {
  for (const p of pick) {
    const v = process.env[p];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

function buildChunks(): Raw[] {
  const out: Raw[] = [];
  const push = (source: string, refId: string, title: string, text: string) => {
    const t = String(text || "").trim();
    if (t) out.push({ source, refId, title: String(title).slice(0, 200), text: t.slice(0, 1800) });
  };

  // Enciclopédia: funções internas, Xbase, dicas, erros, programação
  const encLists: [string, [string, string][]][] = [
    ["funcao", ENCYCLOPEDIA.funcoes],
    ["xbase", ENCYCLOPEDIA.vfp],
    ["dica", ENCYCLOPEDIA.dicas],
    ["erro", ENCYCLOPEDIA.erros],
    ["programacao", ENCYCLOPEDIA.prog],
  ];
  for (const [tag, list] of encLists) {
    for (const [name, desc] of list)
      push("encyclopedia", `${tag}:${name}`, name, `${name} — ${desc}`);
  }
  // artigos técnicos
  for (const sec in ENCYCLOPEDIA.artigos) {
    for (const [title, body] of ENCYCLOPEDIA.artigos[sec]) {
      push("encyclopedia", `artigo:${title}`, `${sec}: ${title}`, body || title);
    }
  }
  // índice do manual (nomes de tópicos)
  for (const sec in ENCYCLOPEDIA.manual) {
    for (const topic of ENCYCLOPEDIA.manual[sec]) {
      push("encyclopedia", `manual:${sec}:${topic}`, topic, `Manual · ${sec}: ${topic}`);
    }
  }

  // Dicionário
  for (const g of GLOSSARY)
    push("glossary", g.t, g.t, `${g.t}: ${g.d}${g.pratica ? " · Prática: " + g.pratica : ""}`);

  // Esquema de BD (core + harvest)
  for (const [table, desc, fields] of PHC_SCHEMA.core)
    push("schema", table, table, `Tabela ${table} — ${desc}. Campos: ${fields}`);
  for (const table in PHC_SCHEMA.harvest) {
    const h = PHC_SCHEMA.harvest[table];
    push(
      "schema",
      table,
      table,
      `Tabela ${table} — campos observados na documentação: ${h.f.join(", ")}`,
    );
  }

  // Missões (objetivo + conceito + passos)
  for (const l of LABS) {
    const th = THEORY[l.id];
    const text = [
      `Missão ${l.id}: ${l.t}.`,
      `Objetivo: ${l.goal}`,
      th ? `Conceito: ${th.c}` : "",
      `Passos: ${l.steps.join(" | ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    push("mission", l.id, `${l.id} · ${l.t}`, text);
  }

  // Circuitos
  for (const c of CIRCUITS) {
    const text = [`${c.t}: ${c.d}`, ...c.slides.map((s) => `${s.t} — ${s.d}`)].join("\n");
    push("circuit", c.id, c.t, text);
  }

  return out;
}

export { buildChunks };

async function main() {
  // DRY_RUN=1 → só constrói e conta os chunks (sem Mongo/embeddings); útil p/ validar
  if (process.env.DRY_RUN === "1") {
    const chunks = buildChunks();
    const by: Record<string, number> = {};
    for (const c of chunks) by[c.source] = (by[c.source] ?? 0) + 1;
    console.log(`DRY_RUN: ${chunks.length} chunks →`, JSON.stringify(by));
    console.log("exemplo:", JSON.stringify(chunks[0]).slice(0, 160));
    process.exit(0);
  }
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/phc-trainer";
  const keys = {
    gemini: key(["GEMINI_API_KEY", "AI_KEY_GEMINI", "GOOGLE_API_KEY"]),
    openrouter: key(["OPENROUTER_API_KEY", "AI_KEY_OPENROUTER"]),
  };
  const prov = embedProvider(keys);
  if (!prov) {
    console.error(
      "❌ Sem chave de embeddings. Defina GEMINI_API_KEY (recomendado) ou OPENROUTER_API_KEY.",
    );
    process.exit(1);
  }
  const model = prov === "gemini" ? EMBED_MODEL_GEMINI : EMBED_MODEL_OPENAI;
  console.log(`🌱 Seed RAG · fornecedor: ${prov} · modelo: ${model}`);
  console.log(`   Mongo: ${uri.replace(/:([^:@/]+)@/, ":****@")}`);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("   ligado ao Mongo.");

  const chunks = buildChunks();
  console.log(`   ${chunks.length} chunks para embeddar (por grupos de 100)…`);

  let done = 0;
  let failed = 0;
  const BATCH = 100;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const group = chunks.slice(i, i + BATCH);
    try {
      const vectors = await embedTexts(
        group.map((c) => `${c.title}\n${c.text}`),
        keys,
      );
      const ops = group.map((c, j) => ({
        updateOne: {
          filter: { source: c.source, refId: c.refId },
          update: { $set: { ...c, vector: vectors[j], dims: vectors[j]?.length ?? 0, model } },
          upsert: true,
        },
      }));
      await Chunk.bulkWrite(ops);
      done += group.length;
    } catch (e) {
      failed += group.length;
      console.warn(
        `   ⚠ grupo ${i}-${i + group.length} falhou: ${String((e as Error).message).slice(0, 120)}`,
      );
      // rate limit: espera e segue
      await new Promise((r) => setTimeout(r, 1500));
    }
    if ((i / BATCH) % 5 === 0) console.log(`   … ${done}/${chunks.length}`);
  }

  invalidateRagCache();
  const total = await Chunk.countDocuments();
  console.log(
    `✅ Seed concluído: ${done} embeddados, ${failed} falharam. Total na coleção: ${total}.`,
  );
  console.log(
    "   O tutor de IA já usa busca semântica (RAG) quando houver chunks + chave de embeddings.",
  );
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed falhou:", e);
  process.exit(1);
});
