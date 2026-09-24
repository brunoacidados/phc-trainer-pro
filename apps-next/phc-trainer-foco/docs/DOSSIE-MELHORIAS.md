# Dossiê de Melhorias — PHC Trainer Pro → PHC Trainer Foco (edição TDAH)

> Repositório analisado: `brunoacidados/phc-trainer-pro`, branch `main`, commit `2e15769` (v6.16.0, 62 commits).
> Também foi analisada a branch `claude` (tentativa anterior, commit `93c4cba`) para não repetir erros e validar as suas conclusões.

---

## 1. Visão geral executiva

O PHC Trainer Pro tem **conteúdo pedagógico de grande valor** — 114 missões práticas, 188 cartas, 17 testes de nível, 94 termos de glossário, guia de 15 capítulos, enciclopédia de 300 KB — e uma engenharia ambiciosa: monorepo pnpm, Express 5 + MongoDB, React 19 + Vite, JWT com rotação, router de IA com 6 fornecedores, TTS, RAG, SSE, PWA offline, i18n, painel de formador e ~40 testes.

**O problema central não é falta de funcionalidades: é excesso.** Para uma pessoa com TDAH cada elemento visível compete pela atenção. A página inicial mistura hero, revisões, atribuições, curso personalizado, trilha de setor, 4 estatísticas e barra de progresso; a página "Aprender" tem 916 linhas e 8+ separadores; há mascote animado que fala, chat global, *command palette*, onboarding de 4 passos. O custo é paralisia de decisão e abandono.

Há também **bugs que afetam todos os alunos** (barra de progresso geral presa em 0–1%, cinto máximo limitado ao nível 12 de 17, progresso de cartas indexado pela posição do array, "sei de cor" sem qualquer evidência) e **erros de conteúdo** (apuramento de IVA invertido, datas legais do QR/ATCUD erradas, NOLOCK recomendado como regra, `stamp` descrito como campo de versão). Uma lacuna grave: **zero conteúdo sobre tratamento de erros em código** (nenhum TRY/CATCH, nenhuma transação).

**Entregámos** uma aplicação Next.js 16 + PostgreSQL que reaproveita todo o núcleo pedagógico com errata verificada, corrige o motor de aprendizagem (34 testes), redesenha a experiência à volta de uma única próxima ação e acrescenta 8 exemplos resolvidos de tratamento de código com fontes.

---

## 2. Problemas críticos encontrados

### 2.1 Arquitetura

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| A1 | Âmbito disperso: 12 páginas, 8 *features*, IA, TTS, RAG, SSE, PWA, i18n, admin, auditoria | `apps/web/src/pages/*` ≈ 5 000 linhas; `apps/api/src/routes/*` | Manutenção cara; cada nova funcionalidade aumenta a carga cognitiva do aluno |
| A2 | Progresso como **um único documento JSON** mutado no cliente e sincronizado inteiro | `packages/shared/src/srs.ts` (mutações diretas em `s`) | Último a escrever ganha entre dispositivos; consultas agregadas impossíveis sem carregar tudo |
| A3 | Progresso das cartas indexado pela **posição** no array | `cardSt(s, idx)` → `s.cards[String(idx)]` | Inserir 25 cartas no nível 9 (v6.14) desalinhou o progresso de todas as seguintes |
| A4 | 6 fornecedores de IA + TTS com chaves por equipa | `services/aiRouter.ts`, `providers.ts`, `tts.ts` | Grande superfície de falha/custo para uma funcionalidade periférica |
| A5 | App legado de ~900 KB (`index.html`, `sw.js`) na raiz a coexistir com o monorepo | raiz | Ambiguidade sobre a fonte de verdade |
| A6 | Datas no fuso do dispositivo | `todayISO()` com `getDate()` | No servidor (UTC) atividade depois da meia-noite de Lisboa conta no dia errado |

### 2.2 Código (bugs confirmados por leitura e teste)

| # | Bug | Onde | Correção nesta versão |
|---|---|---|---|
| B1 | `overallPct()` faz `Math.round(fração ≤ 1)` sem ×100 → devolve sempre 0 ou 1 | `srs.ts` | `domain/progression.ts#overallPct` + teste |
| B2 | `currentBelt()` com `Math.min(lv + 1, 12)` apesar de haver 17 níveis | `srs.ts` | `levelsCompleted` sem teto + teste com 17 níveis |
| B3 | "Errei" agenda +1 dia mas **mantém** o contador → a certa seguinte salta para o intervalo longo | `rateCard()` | Lapso → caixa 0 (Leitner) + teste |
| B4 | `markLabMastered` não exige nada | `srs.ts` | `masteryBlockers`: provas completas + 2 repetições espaçadas, validado no servidor |
| B5 | Passo duplicado em L00 | `labs.json` | Errata E1 (regra geral) |
| B6 | Pontuação do teste calculada no cliente (`submitQuiz(s, lv, pct)`) | `srs.ts` | `scoreQuiz` no servidor a partir das respostas |
| B7 | **(novo)** Repetições no mesmo dia avançam a escada: 5 cliques numa tarde = "revisto a 30 dias" | `registerLabRep()` | `registerRep` só avança se vencida; teste |

### 2.3 Conceitos — ver secção 3.

### 2.4 UI/UX (ótica TDAH)

| # | Problema | Porque pesa mais com TDAH |
|---|---|---|
| U1 | Página inicial com 7+ blocos concorrentes | Défice de inibição: tudo o que é visível compete; sem prioridade clara → não começa |
| U2 | Navegação com 6 destinos + header cheio (notificações, sync, mascote, palette) | Mais decisões por ecrã → fadiga de decisão |
| U3 | Missão mostra conceito, passos, provas, perguntas, evidências, cronómetro e botões ao mesmo tempo | Memória de trabalho limitada → sobrecarga → abandono |
| U4 | Teoria em parágrafos de 5–8 frases densas | Leitura sustentada custosa; perde-se o fio |
| U5 | Mascote animado que pisca, fala e festeja | Distrator constante; sem modo de baixo estímulo |
| U6 | Streak que volta a 1 ao falhar um dia | Falhar é previsível; perder a sequência gera vergonha → evitamento |
| U7 | XP e leaderboard | Comparação social e números abstratos; recompensa distante |
| U8 | Bloqueio sequencial rígido | Frustração ao querer saltar o que já domina |
| U9 | Respostas das perguntas visíveis de imediato | Elimina o esforço de recuperação — o que mais fixa |

---

## 3. Validação de conceitos

Legenda: ✅ correto · ⚠️ parcial/incompleto · ❌ incorreto

### 3.1 Conceitos técnicos e fiscais

| Conceito (onde) | Veredito | Análise e fonte |
|---|---|---|
| Apuramento do IVA "a pagar (2432>2433)" (L62) | ❌ | 2432 = IVA dedutível, 2433 = IVA liquidado (SNC, Portaria 218/2015). Há IVA a pagar quando **2433 > 2432**. Corrigido (E2). |
| "Desde 2021 todos os documentos imprimem QR + ATCUD" (L34, carta, glossário) | ❌ | DL 28/2019 e Portaria 195/2020 previam 2021, mas o **QR só foi obrigatório a 1/1/2022** (OE2021) e o **ATCUD a 1/1/2023** (Despacho 351/2021-XXII suspendeu 2022). ATCUD acima do QR, em todas as páginas. Corrigido (E3). **A errata da branch `claude` ("QR desde 2021") também estava errada.** |
| "NOLOCK em leituras" como boa prática (L41, carta) | ⚠️ | NOLOCK = READUNCOMMITTED: lê dados não confirmados, pode duplicar ou saltar linhas (Microsoft Learn — Table hints). Aceitável em análises indicativas; nunca em valores de faturação/IVA/crédito. Corrigido (E4) + exemplo de código. |
| "stamp marca a versão do registo para concorrência" (teoria) | ❌ | Em PHC, `<tabela>stamp` (clstamp, ftstamp…) é a **chave técnica única** do registo; as linhas guardam o stamp do cabeçalho (fi.ftstamp). `ref` é a referência do artigo. Corrigido (E5) + exemplo de JOIN. |
| Inversão do sujeito passivo "nas aquisições intracomunitárias" (L62) | ⚠️ | A autoliquidação do art. 2.º n.º 1 CIVA (construção civil, sucatas, serviços de não residentes) é distinta do regime das aquisições intracomunitárias de bens (RITI), embora ambos impliquem autoliquidação. Corrigido (E8). |
| SQL Server Express "sem SQL Agent, limite de recursos" (L01) | ✅ | Correto (limite de 10 GB por BD, sem SQL Agent, recursos de CPU/memória limitados). |
| "Análise é LEITURA; correções fazem-se pelos ecrãs" (L41) | ✅ | Excelente princípio; reforçado no exemplo "UPDATE seguro". |
| Tratamento de erros (TRY/CATCH, transações, XACT_ABORT, THROW) | ❌ **ausente** | Nenhuma menção em 114 missões. Acrescentados 3 exemplos SQL + 1 Xbase com fontes Microsoft Learn e Sommarskog. |
| Injeção de SQL em Xbase (`u_sqlexec` com concatenação) | ❌ **ausente** | Acrescentado exemplo com escape/validação + referência OWASP; **dúvida declarada** sobre parâmetros `?m.var` no `u_sqlexec`. |
| TRY/CATCH em Visual FoxPro | ❌ **ausente** | Acrescentado. Regra verificada: RETURN não é permitido dentro de TRY/CATCH/FINALLY (erro 2060, Microsoft Learn — VFP Structured Error Handling). |

### 3.2 Conceitos pedagógicos

| Conceito | Veredito | Análise |
|---|---|---|
| Repetição espaçada "no momento em que está quase a esquecer" | ⚠️ | O efeito de espaçamento é robusto (Cepeda et al., 2006, meta-análise de 317 experiências). Mas uma escada fixa não sabe quando *cada pessoa* está a esquecer — isso é o que fazem algoritmos adaptativos (SM-2, FSRS). Texto corrigido (E6); a app explica o trade-off. |
| Lapsos no SRS (implementação) | ❌ | Leitner (1972): item falhado volta à 1.ª caixa. Corrigido (B3). |
| Prática deliberada | ✅/⚠️ | Fiel a Ericsson et al. (1993). Nuance acrescentada: a prática explica só parte da variância (Macnamara et al., 2014). |
| "Sem prova o cérebro auto-engana-se" | ✅ | Consistente com ilusões de competência (Bjork, Dunlosky & Kornell, 2013). Agora aplicado de facto (B4). |
| Perguntas das missões | ✅ mal aplicado | *Testing effect* (Roediger & Karpicke, 2006) exige tentar recordar antes de ver. A UI original mostrava a resposta; agora "Já pensei — mostrar resposta". |
| Meta de 5 ações + streak | ⚠️ | Metas pequenas funcionam (Locke & Latham, 2002). Reduzida para 3; streak substituído por "dias ativos em 7". Evidência sobre streaks em TDAH é limitada — declarado na página /metodo. |

---

## 4. Oportunidades priorizadas (Impacto × Esforço)

| Prioridade | Oportunidade | Impacto | Esforço | Estado |
|---|---|---|---|---|
| P0 | Corrigir erros factuais (IVA, ATCUD, NOLOCK, stamp) | Alto | Baixo | ✅ feito, com script + testes |
| P0 | Corrigir B1–B7 | Alto | Baixo | ✅ feito, 19 testes de domínio |
| P0 | "Uma próxima ação" no ecrã inicial | Alto | Médio | ✅ |
| P0 | Missão em 6 etapas | Alto | Médio | ✅ |
| P1 | Exemplos de tratamento de código | Alto | Médio | ✅ 8 exemplos |
| P1 | Temas + modo foco + tamanhos | Alto | Baixo | ✅ |
| P1 | Modelo de dados normalizado | Médio | Médio | ✅ |
| P2 | Painel de formador / equipas | Médio | Alto | ⏳ 2.ª passagem |
| P2 | Contas com login (multi-dispositivo) | Médio | Médio | ⏳ |
| P3 | IA/TTS | Baixo–médio | Alto | ⏳ opcional, atrás de *feature flag* |
| P3 | Enciclopédia e guia completos | Médio | Médio | ⏳ requer revisão de conteúdo |

---

## 5. Recomendações de UI/UX para TDAH (implementadas)

1. **Uma ação principal por ecrã**, com o *porquê* e o tempo estimado. Alternativas atrás de "Prefiro fazer outra coisa" (autonomia sem ruído).
2. **Chunking**: missão em 6 etapas; teoria partida frase a frase com marcadores; termos-chave fechados (abrir só os desconhecidos).
3. **Divulgação progressiva**: `<details>` nativo (acessível, sem JS) para termos, recursos, fontes, progresso geral.
4. **Feedback imediato e previsível**: checklists otimistas (`useOptimistic`), cada botão de carta mostra *quando volta*, testes explicam logo cada resposta, erros sempre visíveis (`role="alert"`) e nunca silenciosos.
5. **Hierarquia visual**: uma cor de destaque = ação principal. Tudo o resto em tons neutros.
6. **Tipografia**: 18 px base (20/23 px opcional), entrelinha 1,65, largura ≤ 68 caracteres.
7. **Contraste AAA** (≥ 7:1) nos três temas; tema **calmo** sem sombras nem animações.
8. **Navegação previsível**: 4 destinos + "Mais"; migalhas em todas as páginas internas; etapas com URL (botão "voltar" funciona, retoma-se onde parou).
9. **Modo foco**: esconde navegação e migalhas; ativável dentro da missão.
10. **Micro-progressos**: "3 de 8 passos feitos", barra por etapa, meta diária de 3 círculos, "Meta cumprida. Pode parar aqui, de consciência tranquila."
11. **Sem punição**: sem streak, sem XP, sem ranking. Carta falhada "volta amanhã, sem penalização". Teste reprovado: "Ainda não — e está tudo bem".
12. **Tempo visível**: sprint opcional de 10/15/25 min, sem som.
13. **Acessibilidade**: *skip link*, foco de 3 px, alvos ≥ 44 px, `aria-live` em mudanças, atalhos de teclado nas cartas (Espaço, 1/2/3), `prefers-reduced-motion` respeitado.
14. **Linguagem**: frases curtas, voz ativa, próxima ação explícita em cada mensagem de erro.

---

## 6. Plano de refatoração

| Fase | Conteúdo | Estado |
|---|---|---|
| 1 | Extrair domínio puro (`src/domain`) com testes | ✅ |
| 2 | Errata reprodutível + testes de regressão de conteúdo | ✅ |
| 3 | Esquema normalizado em PostgreSQL (Drizzle) | ✅ |
| 4 | Novas rotas Next.js com Server Components + Server Actions | ✅ |
| 5 | Exemplos de código | ✅ |
| 6 | Autenticação opcional (e-mail mágico) + ligar `learners` a contas | ⏳ |
| 7 | Painel de formador (leitura agregada: cartas vencidas, missões paradas) | ⏳ |
| 8 | Migração de progresso do v6 (Mongo → Postgres), mapeando cartas por texto (hash) | ⏳ script a escrever |
| 9 | Corte: arquivar legado v5 e v6 | ⏳ decisão do dono |

---

## 7. Riscos e trade-offs

| Decisão | Ganho | Custo / risco | Mitigação |
|---|---|---|---|
| Identidade anónima por cookie | Zero fricção até à 1.ª vitória | Limpar cookies = perder progresso; sem multi-dispositivo | Fase 6: login opcional que "adota" o id anónimo |
| Escada fixa em vez de FSRS | Previsível, explicável | Menos eficiente | Interface `reviewCard` isolada → trocar o algoritmo sem mexer na UI |
| Respostas dos testes no cliente | Feedback imediato | Quem quiser pode ver as respostas | É treino, não certificação; pontuação recalculada no servidor |
| Remover IA, TTS, mascote, equipas | Foco, menos falhas | Perda de funcionalidades existentes | Documentado como 2.ª passagem; o monorepo v6 continua na `main` |
| Todos os níveis abertos | Autonomia | Alguém pode saltar fundamentos | Ordem recomendada + pré-requisitos visíveis |
| Nomes de campos PHC nos exemplos | Exemplos concretos | Podem variar entre versões | Aviso explícito em cada exemplo: confirmar no Dicionário de Dados |
