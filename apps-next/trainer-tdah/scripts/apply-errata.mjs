/**
 * Aplica as correções de conteúdo (errata) validadas no Dossiê de Melhorias.
 * Idempotente: pode correr várias vezes. Uso: node scripts/apply-errata.mjs
 * Cada correção tem id, justificação e fonte — ver docs/ERRATA.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src/content/data");
const load = (f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const save = (f, d) => writeFileSync(join(dir, f), JSON.stringify(d, null, 2) + "\n");

const labs = load("labs.json");
const theory = load("theory.json");
const cards = load("cards.json");
let changed = 0;

// E1 — passo duplicado na missão L00
for (const lab of labs) {
  const before = lab.steps.length;
  lab.steps = lab.steps.filter((s, i, a) => a.indexOf(s) === i);
  if (lab.steps.length !== before) changed++;
}

// E2 — contas SNC do apuramento de IVA invertidas (2432 = dedutível, 2433 = liquidado)
const replaceIn = (obj, from, to) => {
  const s = JSON.stringify(obj);
  if (!s.includes(from)) return obj;
  changed++;
  return JSON.parse(s.split(from).join(to));
};
theory.L62 = replaceIn(
  theory.L62,
  "a pagar (2432>2433) ou a recuperar/crédito",
  "a pagar quando o IVA liquidado (2433) é maior do que o dedutível (2432); a recuperar/crédito no caso inverso",
);

// E3 — datas legais de QR Code / ATCUD
theory.L34 = replaceIn(
  theory.L34,
  "Desde 2021 (v27 do PHC CS) todos os documentos fiscalmente relevantes imprimem QR Code + ATCUD.",
  "O QR Code é obrigatório desde 1 jan 2021 e o ATCUD desde 1 jan 2023 (DL 28/2019, Portaria 195/2020; em 2022 a obrigação do ATCUD esteve suspensa pelo Despacho 351/2021-XXII). Em documentos com várias páginas, o ATCUD aparece em todas, imediatamente acima do QR Code.",
);

// E4 — NOLOCK apresentado como boa prática universal (tem custos: leituras sujas)
theory.L41 = replaceIn(
  theory.L41,
  "NOLOCK em leituras,",
  "NOLOCK só em leituras analíticas onde aceita dados ainda não confirmados (leituras sujas, linhas duplicadas ou em falta),",
);
const nolockCard = cards.find((c) => typeof c.b === "string" && c.b.startsWith("WITH (NOLOCK) em consultas analíticas"));
if (nolockCard && !nolockCard.b.includes("leituras sujas")) {
  nolockCard.b = nolockCard.b.replace(
    "WITH (NOLOCK) em consultas analíticas",
    "WITH (NOLOCK) só em consultas analíticas que toleram leituras sujas",
  );
  changed++;
}

save("labs.json", labs);
save("theory.json", theory);
save("cards.json", cards);
console.log(`errata aplicada: ${changed} alteração(ões)`);
