# Errata de conteúdo

Aplicada por `node scripts/apply-errata.mjs` (idempotente) sobre `src/content/data/*.json`.
Os testes em `src/domain/__tests__/content.test.ts` garantem que não regride.

| Id | Onde | Antes | Depois | Fonte |
|---|---|---|---|---|
| E1 | `labs.json` L00 | Passo "Abrir 📚 Aprender → 📥 Recursos…" repetido | Removido o duplicado | — |
| E2 | `theory.json` L62 | "Apuramento: a pagar (2432>2433)" | "a pagar quando o IVA liquidado (2433) é maior do que o dedutível (2432); a recuperar no caso inverso" | SNC — Código de Contas (Portaria 218/2015): 2432 IVA dedutível, 2433 IVA liquidado |
| E3 | `theory.json` L34 | "Desde 2021 (v27 do PHC CS) todos os documentos… QR Code + ATCUD" | QR obrigatório desde 1 jan 2021; ATCUD desde 1 jan 2023 (suspenso em 2022); ATCUD acima do QR em todas as páginas | DL 28/2019; Portaria 195/2020; Despacho 351/2021-XXII |
| E4 | `theory.json` L41 + 1 carta | "NOLOCK em leituras" como boa prática geral | "NOLOCK só em leituras analíticas que toleram leituras sujas…" | Microsoft Learn — Table hints (READUNCOMMITTED) |

## Pendentes (2.ª passagem, não usados pela nova app)

- `packages/content/src/data/schema.json` → `universal`: "todas as tabelas usam ref e stamp (versão/concorrência)" — `ref` é a referência do artigo; `<tabela>stamp` é o identificador único do registo.
- `theory.json` L62 — distinguir aquisições intracomunitárias (RITI) de inversão do sujeito passivo (art. 2.º CIVA).
