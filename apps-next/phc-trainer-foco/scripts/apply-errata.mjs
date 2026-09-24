#!/usr/bin/env node
/**
 * Errata de conteúdo — reprodutível e idempotente.
 *
 * Porquê um script (e não editar os JSON à mão)?
 *  - O conteúdo vem do repositório original (packages/content/src/data). Se for
 *    re-importado, basta correr `node scripts/apply-errata.mjs` outra vez.
 *  - Cada correção tem id, fonte e texto antes/depois → auditável (docs/ERRATA.md).
 *  - Se o texto "antes" desaparecer E o "depois" não existir, o script FALHA
 *    (exit 1). Assim uma correção nunca se perde em silêncio.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "data");

/** @type {{id:string, from:string, to:string}[]} */
const REPLACEMENTS = [
  {
    id: "E2-iva-apuramento",
    from: "Liquidação do saldo: a pagar (2432>2433) ou a recuperar/crédito.",
    to: "Liquidação do saldo do período: há IVA a pagar quando o IVA liquidado (2433) é maior do que o IVA dedutível (2432); no caso inverso há IVA a recuperar (reporte ou reembolso).",
  },
  {
    id: "E3-qr-atcud-teoria",
    from: "Desde 2021 (v27 do PHC CS) todos os documentos fiscalmente relevantes imprimem QR Code + ATCUD.",
    to: "Os documentos fiscalmente relevantes têm de imprimir Código QR (obrigatório desde 1 jan 2022) e ATCUD (obrigatório desde 1 jan 2023, imediatamente acima do QR e em todas as páginas). O DL 28/2019 previa 2021, mas o prazo foi adiado (OE2021; Despachos 412/2020-XXII e 351/2021-XXII). O PHC CS preparou-se na v27.",
  },
  {
    id: "E3-qr-atcud-carta",
    from: "O software impede a impressão dos documentos (regra desde 01/01/2021, implementada na v27).",
    to: "O software impede a impressão: sem código de validação não se forma o ATCUD, obrigatório desde 01/01/2023 (Portaria 195/2020; Despacho 351/2021-XXII).",
  },
  {
    id: "E3-qr-atcud-glossario",
    from: "Desde 2021 é obrigatório.",
    to: "Obrigatório desde 1 jan 2023 (o Código QR desde 1 jan 2022).",
  },
  {
    id: "E4-nolock-teoria",
    from: "Boas práticas: NOLOCK em leituras,",
    to: "Boas práticas: filtrar por período e usar TOP enquanto explora, só usar NOLOCK em análises indicativas (lê dados não confirmados e pode duplicar ou saltar linhas),",
  },
  {
    id: "E4-nolock-termo",
    from: "Hint de leitura sem bloqueios — standard nas análises (aceita 'leituras sujas').",
    to: "Hint equivalente a READUNCOMMITTED: não pede bloqueios partilhados, mas pode ler dados não confirmados e até duplicar ou saltar linhas. Aceitável em análises indicativas; nunca em valores para faturar, pagar ou declarar.",
  },
  {
    id: "E4-nolock-carta",
    from: "WITH (NOLOCK) em consultas analíticas, respeitar ref/stamp, não alterar esquemas do core, índices via framework.",
    to: "Filtrar por período e TOP enquanto explora; NOLOCK só em análises indicativas (pode ler dados sujos); ligar tabelas pelo stamp (ft.ftstamp = fi.ftstamp); não alterar esquemas do core; índices via framework.",
  },
  {
    id: "E5-stamp",
    from: "ref identifica o registo; stamp marca a 'versão' do registo para concorrência/navegação — aparece em snapshots como #stamp#.",
    to: "<tabela>stamp (ex.: clstamp, ftstamp) é a chave técnica única de cada registo, gerada pela aplicação: é por ela que cabeçalho e linhas se ligam (ft.ftstamp = fi.ftstamp) e é o valor que #stamp# injeta nos snapshots. ref é a referência do artigo (st.ref), não um identificador genérico de registo.",
  },
  {
    id: "E6-srs-honesto",
    from: "Repetição espaçada = repetir em intervalos crescentes (1, 2, 4, 7... dias) no momento em que está quase a esquecer — é o que fixa na memória de longo prazo.",
    to: "Repetição espaçada = rever em intervalos crescentes (1, 2, 4, 7... dias). Espaçar revisões fixa muito melhor do que concentrá-las (Cepeda et al., 2006). Esta escada fixa é uma aproximação simples e previsível; algoritmos adaptativos (SM-2, FSRS) ajustam o intervalo a cada pessoa.",
  },
  {
    id: "E7-ui-legado-recursos",
    from: "Abrir 📚 Aprender → 📥 Recursos: baixar o guia (.md), os flashcards (.csv, só p/ Anki externo) e instalar a app (PWA). O estudo de cartas já é NATIVO em 🧠 Praticar — sem imports manuais.",
    to: "Abrir a secção Cartas desta app e rever as primeiras 5 cartas do nível 0 (o estudo é nativo, sem imports).",
  },
  {
    id: "E7-ui-legado-exportar",
    from: "Abrir este app no navegador, clicar em 💾 Exportar e guardar o primeiro backup do progresso em C:\\PHC-Treino\\notas\\",
    to: "Confirmar que o progresso desta app fica guardado automaticamente (marque este passo e recarregue a página)",
  },
  {
    id: "E8-autoliquidacao",
    from: "Nas aquisições intracomunitárias e em certos serviços (ex.: construção, sucata), é o ADQUIRENTE que autoliquida o IVA: liquida e deduz em simultâneo, nos campos próprios da declaração periódica.",
    to: "Nas situações do art. 2.º, n.º 1 do CIVA (ex.: serviços de construção civil, sucatas, serviços adquiridos a não residentes) é o ADQUIRENTE que autoliquida o IVA: liquida e deduz em simultâneo, nos campos próprios da declaração periódica. As aquisições intracomunitárias de bens seguem um regime próprio (RITI) com a mesma lógica de autoliquidação.",
  },
];

const FILES = ["labs", "theory", "quizzes", "cards", "glossary", "belts"];
const docs = Object.fromEntries(FILES.map((f) => [f, JSON.parse(readFileSync(join(DATA, f + ".json"), "utf8"))]));

let replaced = 0;
function deepReplace(node, from, to, hit) {
  if (typeof node === "string") {
    if (node.includes(from)) {
      hit.n++;
      return node.split(from).join(to);
    }
    if (node.includes(to)) hit.already = true;
    return node;
  }
  if (Array.isArray(node)) return node.map((x) => deepReplace(x, from, to, hit));
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) node[k] = deepReplace(node[k], from, to, hit);
  }
  return node;
}

const report = [];
let failed = false;
for (const r of REPLACEMENTS) {
  const hit = { n: 0, already: false };
  for (const f of FILES) docs[f] = deepReplace(docs[f], r.from, r.to, hit);
  replaced += hit.n;
  const status = hit.n ? `aplicada (${hit.n}×)` : hit.already ? "já aplicada" : "NÃO ENCONTRADA";
  if (!hit.n && !hit.already) failed = true;
  report.push(`${r.id.padEnd(26)} ${status}`);
}

// E1 — passos duplicados em qualquer missão (regra geral, não só L00)
let dupes = 0;
for (const lab of docs.labs) {
  const seen = new Set();
  lab.steps = lab.steps.filter((s) => (seen.has(s) ? (dupes++, false) : (seen.add(s), true)));
}
report.push(`${"E1-passos-duplicados".padEnd(26)} ${dupes ? `removidos ${dupes}` : "nenhum"}`);

for (const f of FILES) writeFileSync(join(DATA, f + ".json"), JSON.stringify(docs[f], null, 1) + "\n");
console.log(report.join("\n"));
console.log(`\nTotal de substituições nesta execução: ${replaced}`);
if (failed) {
  console.error("\n✖ Alguma correção não encontrou o texto original nem o corrigido. Rever a errata.");
  process.exit(1);
}
