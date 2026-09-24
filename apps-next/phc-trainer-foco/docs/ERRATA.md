# Errata de conteúdo (verificada)

Aplicada por `node scripts/apply-errata.mjs` sobre `src/content/data/*.json` (cópia do `packages/content/src/data` do repositório original, commit `2e15769`).
O script é **idempotente** e **falha (exit 1)** se o texto original desaparecer sem o corrigido estar presente. Os testes em `src/content/__tests__/content.test.ts` impedem regressões.

| Id | Onde | Antes | Depois | Fonte |
|---|---|---|---|---|
| E1 | `labs.json` L00 (regra geral) | Passo "Abrir 📚 Aprender → 📥 Recursos…" duplicado | Duplicados removidos em todas as missões | — |
| E2 | `theory.json` L62 | "Apuramento: a pagar (2432>2433)" (**invertido**) | A pagar quando o IVA liquidado (2433) > dedutível (2432); a recuperar no inverso | SNC — Código de Contas (Portaria 218/2015) |
| E3 | `theory.json` L34 | "Desde 2021 (v27) todos os documentos… QR + ATCUD" | QR obrigatório desde **1/1/2022**; ATCUD desde **1/1/2023**, acima do QR, em todas as páginas | DL 28/2019; Portaria 195/2020; OE2021; Despachos 412/2020-XXII e 351/2021-XXII |
| E3b | `cards.json` nível 5 | "regra desde 01/01/2021" | ATCUD obrigatório desde 01/01/2023 | idem |
| E3c | `glossary.json` ATCUD | "Desde 2021 é obrigatório." | Obrigatório desde 1/1/2023 (QR desde 1/1/2022) | idem |
| E4 | `theory.json` L41 (texto + termo) e `cards.json` | "NOLOCK em leituras" como boa prática geral; "standard nas análises" | NOLOCK = READUNCOMMITTED: lê dados não confirmados, pode duplicar/saltar linhas; só em análises indicativas | Microsoft Learn — Table hints; Locking & row versioning guide |
| E5 | `theory.json` (termo "ref / stamp") | "stamp marca a 'versão' do registo para concorrência" | `<tabela>stamp` é a chave técnica única (liga cabeçalho↔linhas, ex.: ft.ftstamp = fi.ftstamp); `ref` é a referência do artigo | Dicionário de Dados PHC (fonte primária em cada instalação) |
| E6 | `theory.json` L00 | SRS "no momento em que está quase a esquecer" (atribuído a uma escada fixa) | Escada fixa = aproximação; algoritmos adaptativos (SM-2/FSRS) é que estimam o esquecimento individual | Cepeda et al. 2006; Wozniak 1990; Ye et al. 2022 |
| E7 | `labs.json` L00 | Passos referem UI legada ("💾 Exportar", "📥 Recursos") | Passos alinhados com a nova app | — |
| E8 | `theory.json` L62 | Aquisições intracomunitárias tratadas como "inversão do sujeito passivo" | Autoliquidação do art. 2.º n.º 1 CIVA vs. regime próprio do RITI para aquisições intracomunitárias de bens | CIVA art. 2.º; RITI |

## Nota sobre a errata da branch `claude` anterior
A errata anterior (E3) indicava "QR obrigatório desde 1 jan 2021". **Está incorreto**: o OE2021 adiou a obrigatoriedade do QR para 1/1/2022 (em 2021 era facultativo). Corrigido aqui.

## Pendentes para 2.ª passagem
- `encyclopedia.json` (300 KB) e `guide.json` (89 KB) não são usados pela nova app e não foram revistos linha a linha.
- Planos de subscrição do Evolution ("BD 10 GB nos dois primeiros") — não verificável em fonte pública estável; manter com aviso.
- Módulos 13–16 (CRM, Logística, Ignios, Web) foram autorados recentemente sem fontes citadas; revisão por especialista recomendada.
