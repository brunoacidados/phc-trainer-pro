/**
 * Gera ilustrações vetoriais (SVG) de exemplo para cada nível (belt) do curso,
 * em apps/web/public/img/guia/lvlN.svg — estilo UI de ERP coerente (claro, acento #f5a623).
 * Uso: node scripts/gen-guia-svg.mjs
 * (Quando o serviço de imagens de IA tiver quota, pode substituir estes SVG por PNG equivalentes.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../apps/web/public/img/guia");
fs.mkdirSync(OUT, { recursive: true });

const W = 640, H = 360, AC = "#f5a623", BG = "#f7f8fb", INK = "#26314a", MUT = "#8a94ad", LINE = "#dfe3ec", PANEL = "#ffffff";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function frame(title, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, system-ui, sans-serif">
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect x="24" y="20" width="${W - 48}" height="${H - 40}" rx="12" fill="${PANEL}" stroke="${LINE}"/>
<rect x="24" y="20" width="${W - 48}" height="34" rx="12" fill="#eef1f7"/>
<rect x="24" y="42" width="${W - 48}" height="12" fill="#eef1f7"/>
<circle cx="44" cy="37" r="5" fill="#ff5f57"/><circle cx="62" cy="37" r="5" fill="#febc2e"/><circle cx="80" cy="37" r="5" fill="#28c840"/>
<text x="100" y="42" font-size="14" font-weight="600" fill="${INK}">${esc(title)}</text>
<rect x="24" y="54" width="${W - 48}" height="4" fill="${AC}" opacity="0.9"/>
${inner}
</svg>`;
}

const lbl = (x, y, t) => `<text x="${x}" y="${y}" font-size="11" fill="${MUT}">${esc(t)}</text>`;
const val = (x, y, t, w = 150) =>
  `<rect x="${x}" y="${y}" width="${w}" height="22" rx="5" fill="#fff" stroke="${LINE}"/><text x="${x + 8}" y="${y + 15}" font-size="11.5" fill="${INK}">${esc(t)}</text>`;
const btn = (x, y, t, primary = true) =>
  `<rect x="${x}" y="${y}" width="${18 * t.length + 20}" height="26" rx="6" fill="${primary ? AC : "#fff"}" stroke="${primary ? AC : LINE}"/><text x="${x + 10}" y="${y + 17}" font-size="12" font-weight="600" fill="${primary ? "#171103" : INK}">${esc(t)}</text>`;

function grid(x, y, cols, rows, cw = 92, rh = 22) {
  let s = `<rect x="${x}" y="${y}" width="${cols.length * cw}" height="${(rows + 1) * rh}" rx="6" fill="#fff" stroke="${LINE}"/>`;
  cols.forEach((c, i) => {
    s += `<rect x="${x + i * cw}" y="${y}" width="${cw}" height="${rh}" fill="#eef1f7"/>`;
    s += `<text x="${x + i * cw + 8}" y="${y + 15}" font-size="10.5" font-weight="600" fill="${MUT}">${esc(c)}</text>`;
  });
  for (let r = 0; r < rows; r++)
    for (let i = 0; i < cols.length; i++)
      s += `<rect x="${x + i * cw + 8}" y="${y + (r + 1) * rh + 6}" width="${cw - 24}" height="9" rx="4" fill="${(r + i) % 3 === 0 ? "#e8ebf3" : "#f0f2f8"}"/>`;
  return s;
}

function kpi(x, y, t, v) {
  return `<rect x="${x}" y="${y}" width="130" height="58" rx="8" fill="#fff" stroke="${LINE}"/>${lbl(x + 12, y + 20, t)}<text x="${x + 12}" y="${y + 44}" font-size="20" font-weight="700" fill="${AC}">${esc(v)}</text>`;
}
function bars(x, y, n = 7) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const h = 18 + ((i * 37) % 60);
    s += `<rect x="${x + i * 26}" y="${y + 80 - h}" width="16" height="${h}" rx="3" fill="${i % 2 ? AC : "#cfd6e4"}"/>`;
  }
  return s;
}
function qr(x, y) {
  let s = `<rect x="${x}" y="${y}" width="46" height="46" rx="4" fill="#fff" stroke="${LINE}"/>`;
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++) if ((i * 7 + j * 3) % 3 !== 0) s += `<rect x="${x + 5 + i * 6}" y="${y + 5 + j * 6}" width="5" height="5" fill="${INK}"/>`;
  return s;
}

const T = {
  setup: () =>
    grid(44, 74, ["Base de dados", "Estado"], 4, 78) +
    `<rect x="330" y="74" width="266" height="180" rx="8" fill="#fff" stroke="${LINE}"/>
     <text x="346" y="98" font-size="14" font-weight="600" fill="${INK}">Instalação PHC</text>
     <rect x="346" y="112" width="234" height="10" rx="5" fill="#e8ebf3"/><rect x="346" y="112" width="150" height="10" rx="5" fill="${AC}"/>
     ${lbl(346, 142, "Destino: C:\\\\PHC-Treino")}${lbl(346, 160, "SQL Server: localhost\\\\SQLEXPRESS")}
     ${btn(346, 200, "Avançar")}${btn(440, 200, "Cancelar", false)}`,
  form: (t, fields) =>
    `<rect x="44" y="72" width="200" height="182" rx="8" fill="#fff" stroke="${LINE}"/>${lbl(58, 92, t)}
     ` +
    [0, 1, 2, 3, 4].map((i) => `<rect x="58" y="${102 + i * 26}" width="172" height="14" rx="4" fill="${i === 0 ? "#ffe9c9" : "#f0f2f8"}"/>`).join("") +
    `<rect x="262" y="72" width="334" height="182" rx="8" fill="#fff" stroke="${LINE}"/>
     ` +
    fields.map((f, i) => lbl(280, 96 + i * 34, f[0]) + val(280, 102 + i * 34, f[1], 140) + (f[2] ? lbl(440, 96 + i * 34, f[2][0]) + val(440, 102 + i * 34, f[2][1], 130) : "")).join("") +
    btn(280, 226, "Gravar"),
  invoice: (extra) =>
    grid(44, 74, ["Artigo", "Qtd", "Preço", "IVA"], 4, 86) +
    `<rect x="400" y="74" width="196" height="110" rx="8" fill="#fff" stroke="${LINE}"/>
     ${lbl(414, 96, "Total líquido")}<text x="520" y="98" font-size="12" fill="${INK}" text-anchor="end">1.250,00</text>
     ${lbl(414, 118, "IVA 23%")}<text x="520" y="120" font-size="12" fill="${INK}" text-anchor="end">287,50</text>
     <line x1="414" y1="128" x2="582" y2="128" stroke="${LINE}"/>
     ${lbl(414, 148, "Total")}<text x="520" y="150" font-size="15" font-weight="700" fill="${AC}" text-anchor="end">1.537,50</text>
     ${qr(536, 152)}${extra ?? ""}
     ${btn(44, 232, "Emitir")}${btn(140, 232, "Imprimir", false)}`,
  stock: () =>
    `<rect x="44" y="72" width="552" height="60" rx="8" fill="#fff" stroke="${LINE}"/>
     ${lbl(60, 92, "Fornecedor")}${val(60, 98, "Ibertrónica, S.A.", 160)}${lbl(250, 92, "Nº doc")}${val(250, 98, "EC 2026/001", 90)}${btn(470, 96, "Receber")}
     ` + grid(44, 146, ["Artigo", "Armazém", "Stock", "Mín", "Máx", "PCMP"], 5, 92),
  dash: (k) => kpi(44, 74, k[0][0], k[0][1]) + kpi(188, 74, k[1][0], k[1][1]) + kpi(332, 74, k[2][0], k[2][1]) + `<rect x="44" y="146" width="552" height="108" rx="8" fill="#fff" stroke="${LINE}"/>` + bars(70, 158),
  code: () =>
    `<rect x="44" y="72" width="360" height="182" rx="8" fill="#0d1117"/>
     ` +
    [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="60" y="${90 + i * 22}" width="${120 + ((i * 53) % 180)}" height="9" rx="4" fill="${i % 3 === 0 ? "#7ee787" : i % 3 === 1 ? "#ff7b72" : "#c9d1d9"}" opacity="0.8"/>`).join("") +
    `<rect x="420" y="72" width="176" height="182" rx="8" fill="#fff" stroke="${LINE}"/>${lbl(434, 92, "Eventos de utilizador")}
     ` + [0, 1, 2, 3].map((i) => `<rect x="434" y="${102 + i * 24}" width="148" height="14" rx="4" fill="#f0f2f8"/>`).join("") + btn(434, 210, "Testar"),
  pos: () =>
    [0, 1, 2, 3, 4, 5, 7, 8].map((i) => `<rect x="${44 + (i % 4) * 96}" y="${74 + Math.floor(i / 4) * 74}" width="88" height="66" rx="8" fill="#fff" stroke="${LINE}"/><rect x="${52 + (i % 4) * 96}" y="${82 + Math.floor(i / 4) * 74}" width="72" height="30" rx="4" fill="#eef1f7"/><rect x="${52 + (i % 4) * 96}" y="${118 + Math.floor(i / 4) * 74}" width="40" height="9" rx="4" fill="${AC}" opacity="0.7"/>`).join("") +
    `<rect x="440" y="74" width="156" height="180" rx="8" fill="#fff" stroke="${LINE}"/>${lbl(454, 94, "Talão / FS")}
     ` + [0, 1, 2, 3].map((i) => `<rect x="454" y="${104 + i * 20}" width="128" height="10" rx="4" fill="#f0f2f8"/>`).join("") + `<text x="454" y="206" font-size="15" font-weight="700" fill="${AC}">€ 48,90</text>` + btn(454, 220, "Fechar dia"),
};

const SPECS = [
  ["lvl0", "PHC Trainer — Ambiente & SQL Server", T.setup],
  ["lvl1", "Gestão — Ficha de Cliente", () => T.form("Clientes", [["Nome", "Cliente Modelo, Lda", "NIF", "500000000"], ["Morada", "Rua do Comércio, 45"], ["Zona", "Lisboa", "Idioma", "PT"], ["Cond. pag.", "30 dias"], ["Estado", "Ativo"]])],
  ["lvl2", "Gestão — Faturação (FT)", () => T.invoice(`<text x="400" y="250" font-size="10" fill="${MUT}">ATCUD: ABC123-456</text>`)],
  ["lvl3", "Gestão — Compras & Stocks", T.stock],
  ["lvl4", "Gestão — Financeiro / Tesouraria", () => T.dash([["Saldo banco", "12.4k"], ["A receber", "8.1k"], ["A pagar", "3.2k"]])],
  ["lvl5", "Gestão — Fiscal / SAF-T (AT)", () => T.invoice(qr(452, 190))],
  ["lvl6", "Gestão — Análises & Dashboards", () => T.dash([["Vendas mês", "42k"], ["Margem", "31%"], ["Top cliente", "Hotel"]])],
  ["lvl7", "Framework — Eventos & Código", T.code],
  ["lvl8", "Projeto — Implementação completa", () => T.dash([["Missões", "56/56"], ["Evidências", "120"], ["Testes", "13/13"]])],
  ["lvl9", "Contabilidade — Lançamentos", () => T.form("Lançamento", [["Conta", "21.01.01", "Débito", "1.250,00"], ["Documento", "FT 2026/1"], ["Crédito", "1.250,00"], ["Período", "2026/09"], ["Histórico", "Fatura cliente"]])],
  ["lvl10", "Pessoal — Vencimentos", () => T.form("Funcionário", [["Nome", "Ana Silva", "Categoria", "Técnica"], ["Venc. base", "1.400,00"], ["Subsídio", "1.16"], ["Descontos", "SS 11%"], ["Líquido", "1.102,00"]])],
  ["lvl11", "POS & Retalho — Terminal", T.pos],
  ["lvl12", "Suporte — PAT / Pós-venda", () => T.dash([["PATs abertos", "7"], ["SLA ok", "92%"], ["First-fix", "81%"]])],
];

for (const [name, title, fn] of SPECS) {
  const svg = frame(title, fn());
  fs.writeFileSync(path.join(OUT, name + ".svg"), svg);
}
console.log("SVG gerados:", SPECS.length, "→", OUT);
