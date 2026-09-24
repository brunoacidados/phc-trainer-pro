# Dossiê de Melhorias — PHC Trainer Pro → PHC Trainer (edição TDAH)

> Análise do repositório `brunoacidados/phc-trainer-pro` (commit `2e15769`, v6.16.0, 62 commits) e reescrita do núcleo pedagógico com foco em pessoas com TDAH.

---

## 1. Visão geral executiva

O PHC Trainer Pro tem **conteúdo muito valioso** (114 missões, 188 cartas, 17 testes, glossário de 94 termos, enciclopédia, guia de 15 capítulos) e uma engenharia ambiciosa (monorepo pnpm, Express 5 + MongoDB, React 19, JWT com rotação, IA com router de 6 fornecedores, TTS, RAG, SSE, PWA offline, 40 testes).

O problema central **não é a falta de funcionalidades — é o excesso delas.** A página inicial ("Hoje") junta hero, revisões, atribuições, curso personalizado, trilha de setor, 4 estatísticas e barra de progresso. A página "Aprender" tem 916 linhas e 8+ separadores. Há mascote animado, chat global, command palette, aula guiada com voz, onboarding de 4 passos com IA. Para uma pessoa com TDAH, cada elemento extra compete pela atenção — o custo não é "mais opções", é **paralisia de decisão e abandono**.

Encontrámos ainda **bugs reais que afetam todos os alunos** (a barra de progresso geral nunca passa de 1%, o cinto máximo está preso ao nível 12 de 17, o progresso das cartas desalinha quando se adicionam cartas) e **erros de conteúdo** (contas do apuramento de IVA invertidas, datas legais do QR/ATCUD imprecisas, NOLOCK recomendado sem custos).

**O que entregámos:** uma nova aplicação Next.js 16 + PostgreSQL (Drizzle) que:
1. reaproveita 100% do conteúdo pedagógico (com errata aplicada por script reprodutível);
2. corrige o motor de repetição espaçada e as regras de progressão (36 testes unitários);
3. redesenha a experiência à volta de **uma única próxima ação**, divulgação progressiva e 3 temas (incl. baixo estímulo);
4. acrescenta **8 exemplos resolvidos de código** (SQL/Xbase) com fontes — a maior lacuna pedagógica do original;
5. documenta cada decisão com evidência.

---

## 2. Problemas críticos encontrados

### 2.1 Arquitetura

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| A1 | **Âmbito muito disperso**: 12 páginas + 8 "features" + IA + TTS + RAG + SSE + PWA + i18n + admin + auditoria | `apps/web/src/pages/*` (≈5 000 linhas), `apps/api/src/routes/*` | Manutenção cara; cada funcionalidade nova aumenta a carga cognitiva do aluno |
| A2 | **Estado de progresso como um único documento JSON** (`ProgressState`) mutado no cliente e sincronizado inteiro | `packages/shared/src/srs.ts` — funções `registerLabRep`, `rateCard` mutam `s` | Conflitos de escrita entre dispositivos (último a escrever ganha); impossível consultar "quem tem cartas vencidas" sem carregar todos os documentos |
| A3 | **Progresso das cartas indexado pela posição no array** | `cardSt(s, idx)` com `s.cards[String(idx)]` | Ao inserir as +25 cartas do nível 9 (v6.14), o progresso de todas as cartas seguintes passou a apontar para cartas diferentes |
| A4 | **Dependência de 6 fornecedores de IA + TTS** com chaves cifradas por equipa | `services/aiRouter.ts`, `providers.ts`, `tts.ts` | Superfície de falha e de custo grande para uma funcionalidade periférica à aprendizagem |
| A5 | **App legado de 900 KB** (`index.html`) ainda na raiz, a coexistir com o monorepo | raiz do repo | Confusão sobre qual é a fonte de verdade |
| A6 | **Datas no fuso do dispositivo** | `todayISO()` em `date.ts` usa `getDate()` local | No servidor (UTC) ou em viagem, atividade conta no dia errado |

### 2.2 Código (bugs confirmados)

| # | Bug | Onde | Correção |
|---|---|---|---|
| B1 | `overallPct()` devolve **0 ou 1**: `Math.round(fração ≤ 1)` sem `×100`. A barra "Progresso geral" e o círculo da página Progresso mostram 0%/1% para sempre | `packages/shared/src/srs.ts:153` | `src/domain/progression.ts#overallPct` (×100) + teste |
| B2 | `currentBelt()` com teto **12** fixo apesar de existirem **17** níveis (o commit v6.12 diz "remove hardcodes", mas este ficou) | `srs.ts` → `Math.min(lv + 1, 12)` | `currentBelt` sem teto + teste que garante > 12 |
| B3 | **Lapso não reinicia**: "errei" agenda +1 dia mas mantém `c`; a resposta certa seguinte salta para o intervalo longo | `rateCard()` | `review()` com rating 0 → caixa 0 (Leitner) + teste |
| B4 | **"Sei de cor" sem evidência**: `markLabMastered` não verifica provas nem repetições — contradiz a própria teoria da L00 ("marcar feito sem prova = sensação de progresso sem competência") | `markLabMastered()` | `canMarkMastered()` exige provas completas + ≥2 repetições bem-sucedidas; validado também no servidor |
| B5 | Passo duplicado na missão L00 | `labs.json` | errata E1 |
| B6 | Pontuação de testes calculada no cliente | `submitQuiz(s, lv, pct)` recebe `pct` pronto | `submitQuiz(level, answers)` recalcula no servidor |

### 2.3 Conceitos (ver secção 3 para detalhe)

- **Errado:** apuramento de IVA "a pagar (2432>2433)" — invertido.
- **Impreciso:** "Desde 2021 todos os documentos imprimem QR + ATCUD" — ATCUD só obrigatório desde 2023.
- **Incompleto:** NOLOCK apresentado como boa prática universal; "stamp = versão/concorrência"; SRS descrito como "no momento em que está quase a esquecer" (é o que fazem algoritmos adaptativos, não uma escada fixa).
- **Lacuna:** quase nenhum exemplo de código aplicável — muita teoria sobre SQL/Xbase e zero "aqui está o código errado, aqui o certo, e porquê".

### 2.4 UI/UX (ótica TDAH)

| # | Problema | Porque é pior com TDAH |
|---|---|---|
| U1 | Página inicial com 7+ blocos concorrentes | Défice de controlo inibitório: tudo o que está visível compete pela atenção; sem prioridade clara → não começa |
| U2 | Navegação com 6 destinos + header com notificações, sync, mascote, palette | Mais decisões por ecrã → fadiga de decisão |
| U3 | Página de missão mostra conceito, passos, provas, perguntas, evidências, cronómetro e botões ao mesmo tempo | Memória de trabalho limitada (≈4 elementos, Cowan 2001); sobrecarga → abandono |
| U4 | Parágrafos de teoria com 5–8 frases densas | Leitura sustentada é custosa; perde-se o fio a meio |
| U5 | Mascote animado, que fala, pisca e festeja | Estímulo visual/auditivo constante = distrator; sem modo de baixo estímulo |
| U6 | Streak que volta a 1 quando se falha um dia | Falhar é previsível no TDAH; perder a sequência gera vergonha → evitamento |
| U7 | XP total e leaderboard da equipa | Comparação social e números abstratos ≠ motivação intrínseca; recompensa distante |
| U8 | Bloqueio sequencial rígido missão-a-missão | Frustração quando se quer saltar um passo que já domina; sem "porquê" visível |

---

## 3. Validação de conceitos

Legenda: ✅ correto · ⚠️ parcialmente correto/incompleto · ❌ incorreto

### 3.1 Conceitos pedagógicos

| Conceito (onde) | Veredito | Análise e fonte |
|---|---|---|
| **Repetição espaçada** "repetir em intervalos crescentes (1, 2, 4, 7… dias) no momento em que está quase a esquecer" (theory L00) | ⚠️ | O efeito de espaçamento é dos mais robustos da psicologia (Cepeda et al., 2006, *Psychological Bulletin*, meta-análise de 317 experiências). Mas uma **escada fixa** não sabe quando *cada pessoa* está quase a esquecer — isso é o objetivo de algoritmos adaptativos (SM-2, Wozniak 1990; FSRS, Ye 2022). **Correção:** manter a escada (simples e previsível) e dizer honestamente que é uma aproximação. Implementado em `src/domain/srs.ts` e na página *O método*. |
| **Lapsos no SRS** (implementação `rateCard`) | ❌ | No sistema de Leitner (Leitner, 1972) e no SM-2 um item falhado **volta à primeira caixa**. O original mantinha o contador. Corrigido + teste. |
| **Prática deliberada** "treinar no limite da capacidade com feedback imediato" (L00) | ✅/⚠️ | Definição fiel a Ericsson, Krampe & Tesch-Römer (1993). Falta a nuance: Macnamara, Hambrick & Oswald (2014) mostram que a prática explica apenas parte da variância do desempenho. Acrescentado em *O método*. |
| **Evidência/prova** "sem prova, o cérebro auto-engana-se" | ✅ | Consistente com a literatura sobre **ilusões de competência / metacognição** (Bjork, Dunlosky & Kornell, 2013, *Annual Review of Psychology*). Mantido e reforçado (o domínio agora exige provas). |
| **Testes como aprendizagem** (perguntas das missões, testes de nível) | ✅ | *Testing effect* — Roediger & Karpicke (2006). Melhorado: a resposta fica escondida até o aluno declarar que pensou ("Já pensei — mostrar resposta"). |
| **Meta diária de 5 ações + streak** | ⚠️ | Metas pequenas e específicas funcionam (Locke & Latham, 2002). Mas streaks que "partem" geram abandono em quem falha — e falhar dias é previsível no TDAH. **Correção:** meta configurável (3 por defeito) e "dias ativos esta semana" em vez de sequência. |
| **XP / leaderboard** | ⚠️ | Gamificação tem efeitos pequenos a moderados e muito dependentes do desenho (Sailer & Homner, 2020, *Educational Psychology Review*). Pontuações competitivas podem prejudicar a motivação intrínseca. Removido do caminho principal; progresso é mostrado em unidades concretas (missões, cartas, testes). |

### 3.2 Conceitos técnicos / fiscais

| Conceito (missão) | Veredito | Análise e fonte |
|---|---|---|
| **Apuramento do IVA** "a pagar (2432>2433)" (L62) | ❌ | No SNC, **2432 = IVA dedutível** e **2433 = IVA liquidado**. Há imposto **a pagar quando o liquidado (2433) excede o dedutível (2432)**; no inverso há crédito a recuperar. Fonte: Código de Contas do SNC (Portaria 218/2015), classe 2, conta 243. **Errata E2.** |
| **QR Code + ATCUD** "Desde 2021 todos os documentos imprimem QR + ATCUD" (L34) | ⚠️ | QR Code obrigatório desde **1 jan 2021**; ATCUD obrigatório só desde **1 jan 2023** (DL 28/2019, Portaria 195/2020; em 2022 suspenso pelo Despacho 351/2021-XXII). Em documentos com várias páginas, o ATCUD aparece em todas, imediatamente acima do QR. **Errata E3.** |
| **ATCUD = código de validação + "-" + nº sequencial** (L34) | ✅ | Conforme Portaria 195/2020. |
| **WITH (NOLOCK)** "boas práticas: NOLOCK em leituras" (L41, cartas) | ⚠️ | NOLOCK = `READ UNCOMMITTED`: permite **leituras sujas** e, com movimentação de páginas, **linhas saltadas ou duplicadas** (Microsoft Learn — *Table hints*; *Transaction locking and row versioning guide*). É prática comum no ecossistema PHC para não bloquear utilizadores, mas **não serve para números oficiais**. **Errata E4** + exemplo resolvido `sql-nolock-tradeoff` com regra de decisão. Alternativa robusta: `READ_COMMITTED_SNAPSHOT`. |
| **"Todas as tabelas PHC usam ref e stamp (versão/concorrência)"** (schema.json) | ⚠️ | `ref` é a referência do **artigo** (st, linhas) — não existe em todas as tabelas. O campo `<tabela>stamp` (ex.: `ftstamp`, `clstamp`) funciona como **identificador único/chave** do registo e é usado nas ligações (`bi.bostamp → bo`), não como controlo de versão. Recomendação: corrigir o texto no `schema.json` do repositório original (não é usado pela nova app). |
| **INCLUDED COLUMNS evitam lookup** (L49) | ✅ | Microsoft Learn — *Create indexes with included columns*. Exemplo resolvido `sql-medir-antes-otimizar`. |
| **"Performance é medição, não opinião"** (L49) | ✅ | Boa prática universal; reforçado com `SET STATISTICS IO, TIME` no exemplo. |
| **Return .F. cancela o comportamento** (L46) | ✅ | Semântica VFP (eventos `Valid`/`When` devolvendo .F.). Os nomes exatos dos objetos PHC (`ObjRecebido`, `MeusDados`) não foram verificáveis em documentação pública — marcados como "confirmar na ajuda da sua versão". |
| **Treinar em BD demo, nunca produção** (L00) | ✅ | Princípio básico de gestão de ambientes (ITIL/ISO 27001 — separação de ambientes). |
| **Regime de IVA de caixa (DL 71/2013)** (L62) | ✅ | Correto. |
| **Inversão do sujeito passivo inclui aquisições intracomunitárias** (L62) | ⚠️ | Tecnicamente as aquisições intracomunitárias são tributadas pelo adquirente ao abrigo do RITI (autoliquidação), enquanto a "inversão do sujeito passivo" em sentido estrito é do art. 2.º n.º 1 do CIVA (construção, sucata, etc.). O resultado prático na declaração é semelhante, mas a base legal difere. Sugerido para 2.ª passagem. |

### 3.3 Conceitos de UI/UX para TDAH (usados no redesenho)

| Princípio | Base |
|---|---|
| Reduzir o que está visível; um passo de cada vez | Teoria da carga cognitiva (Sweller, 1988); memória de trabalho ≈ 4 elementos (Cowan, 2001); défices de memória de trabalho frequentes no TDAH (Kasper, Alderson & Hudec, 2012) |
| Recompensas pequenas, imediatas e frequentes | *Delay aversion* no TDAH (Sonuga-Barke, 2003); feedback imediato (Hattie & Timperley, 2007) |
| Acabar o que se começou primeiro | Tarefas abertas ocupam recursos cognitivos (efeito Zeigarnik; Masicampo & Baumeister, 2011, mostram que um plano concreto liberta esses recursos) |
| Divulgação progressiva | Nielsen Norman Group — *Progressive Disclosure* (Nielsen, 2006) |
| Contraste, espaçamento, foco visível | WCAG 2.2: 1.4.6 (contraste 7:1, AAA), 1.4.12 (espaçamento de texto), 2.4.13 (aparência do foco), 2.5.5 (alvos 44px, AAA), 2.3.3 (animação por interação) |
| Guia W3C específico | W3C *Making Content Usable for People with Cognitive and Learning Disabilities* (COGA, 2021) — objetivos 3 (ajudar a focar), 4 (fácil de encontrar), 5 (evitar erros) |

---

## 4. Oportunidades de melhoria priorizadas (Impacto × Esforço)

| Prioridade | Melhoria | Impacto | Esforço | Estado |
|---|---|---|---|---|
| P0 | Corrigir `overallPct`, `currentBelt`, lapso SRS, chave estável das cartas | Alto | Baixo | ✅ Feito |
| P0 | Errata de conteúdo (IVA, QR/ATCUD, NOLOCK, passo duplicado) | Alto | Baixo | ✅ Feito (`scripts/apply-errata.mjs`) |
| P0 | "Hoje" com UMA próxima ação | Muito alto | Baixo | ✅ Feito |
| P1 | Missão em 4 fases, passos um-a-um, teoria em frases | Muito alto | Médio | ✅ Feito |
| P1 | Exemplos resolvidos de código (SQL/Xbase) com fontes | Alto | Médio | ✅ 8 exemplos |
| P1 | Temas (claro/escuro/calmo), escala de letra, espaçamento, movimento, modo foco | Alto | Baixo | ✅ Feito |
| P1 | Domínio exige evidência; pontuação no servidor | Médio | Baixo | ✅ Feito |
| P1 | Progresso em tabelas relacionais (1 linha por missão/carta) | Alto | Médio | ✅ Feito (PostgreSQL) |
| P2 | Autenticação real + equipas/formador | Alto | Alto | ⏭ 2.ª passagem (o original já tem — portar) |
| P2 | Algoritmo adaptativo (FSRS) | Médio | Médio | ⏭ 2.ª passagem |
| P2 | Tutor de IA *opcional* e recolhido (1 botão "Explica-me") | Médio | Médio | ⏭ 2.ª passagem |
| P3 | Enciclopédia, guia completo, circuitos, trilha de setor, cursos | Médio | Médio | ⏭ 2.ª passagem (conteúdo intacto no repo) |
| P3 | Testes E2E (Playwright) dos fluxos principais | Médio | Médio | ⏭ Especificados na secção 6 do README |

---

## 5. Recomendações detalhadas de UI/UX para TDAH (e o que foi implementado)

1. **Uma próxima ação, sempre.** A página "Hoje" mostra um único cartão com um único botão primário. A ordem é decidida pelo algoritmo (`nextAction`): retomar → revisões → cartas → missão nova. *Porquê:* remove a decisão "por onde começo?", que é a barreira de arranque mais comum.
2. **Alternativas escondidas, não eliminadas.** "Prefiro fazer outra coisa" (recolhido) oferece no máximo 2 opções. *Porquê:* autonomia sem sobrecarga.
3. **Missão em 4 fases fixas** (Entender → Fazer → Provar → Verificar) com stepper sempre visível e contadores (`3/7`). *Porquê:* sabe sempre onde está e quanto falta — reduz ansiedade de tarefa.
4. **Um passo por ecrã** com botão "✓ Feito — próximo", setas do teclado e opção "ver todos". *Porquê:* chunking; a lista completa continua a um clique para quem prefere visão geral.
5. **Teoria em frases** (parágrafo dividido em blocos com barra lateral), 3 primeiras visíveis, resto em "Ler mais". Conceitos-chave, erros comuns e recursos oficiais recolhidos. Exemplo de código **aberto por defeito** (é o que mais ajuda a aplicar).
6. **Recordar antes de ver**: perguntas com "Já pensei — mostrar resposta"; cartas com "Mostrar resposta (Espaço)".
7. **Feedback imediato e previsível**: atualizações otimistas com "Guardado ✓" numa região `aria-live`; em falha, reverte e diz exatamente o que aconteceu ("Sem ligação — não foi guardado").
8. **Sessões curtas**: cartas em blocos de no máximo 10 (≈5 min), com barra de progresso. "Errei" volta ao fim da fila — o erro é tratado como parte normal da aprendizagem.
9. **Meta diária em pontos**, pequena (3) e configurável; **dias ativos** em vez de streak.
10. **Modo foco** (botão ou tecla F): esconde navegação, rodapé e blocos secundários.
11. **Tema "Calmo"** de baixo estímulo: paleta dessaturada e quente, emoji a cinzento, zero animações.
12. **Legibilidade**: texto base 18px, entrelinha 1.7, linhas ≤ 68ch, 3 escalas de letra, espaçamento extra (WCAG 1.4.12), contraste ≥ 7:1 nos temas claro/escuro.
13. **Navegação previsível**: 5 destinos fixos, mesma ordem em desktop (topo) e telemóvel (barra inferior com rótulos); migalhas de pão em todas as páginas; link "Saltar para o conteúdo".
14. **Bloqueios com razão explícita**: "🔒 Abre quando praticar mais 2 missões do nível 1" e saída clara (modo livre).
15. **Linguagem direta**: frases curtas, verbos de ação nos botões ("Começar missão", "Fazer revisão"), datas relativas ("amanhã", "em 3 dias").
16. **Sem mascote, sem voz automática, sem notificações** no caminho principal.

---

## 6. Plano de refatoração

**Fase 1 (esta entrega)** — núcleo pedagógico
- `src/content/` — conteúdo copiado de `packages/content` + errata reprodutível + 8 exemplos resolvidos.
- `src/domain/` — regras puras e testadas (SRS, progressão, datas).
- `src/db/schema.ts` — 5 tabelas relacionais.
- `src/server/` — sessão por cookie, consultas, Server Actions com validação.
- `src/app/` — 16 rotas redesenhadas.

**Fase 2** — portar do original, sem reintroduzir ruído
1. Autenticação (reaproveitar o desenho JWT+refresh do `apps/api`, ou Auth.js) e equipas/formador (painel do formador fica numa área separada — o aluno não o vê).
2. Enciclopédia/guia como páginas de consulta com pesquisa (já em `packages/content`).
3. Tutor IA opcional: 1 botão "Explica-me de outra forma" por conceito, recolhido, com o router do servidor existente.
4. Migração de progresso do legado: mapear `labs[id]` → `mission_progress`; cartas por índice → `cardKey` (usar a versão de `cards.json` do momento da exportação para resolver o índice).

**Fase 3** — FSRS, E2E Playwright, PWA offline (fila de sincronização do original é reutilizável).

---

## 7. Riscos e trade-offs

| Decisão | Ganho | Custo / risco | Mitigação |
|---|---|---|---|
| Nova stack (Next.js + PostgreSQL) em vez de evoluir Express + Mongo | Server Components + Server Actions reduzem código cliente; SQL relacional permite consultas por aluno/carta | Duas bases de código até à integração | Entregue em pasta separada (`apps-next/trainer-tdah`), fora do workspace pnpm — não parte o CI existente |
| Perfil por cookie + código de recuperação (sem password) | Onboarding de 1 ecrã | Não é adequado para dados sensíveis/equipas | Documentado; Fase 2 = autenticação real |
| Remover IA/TTS/mascote do caminho principal | Menos distração, menos custos | Alguns alunos gostavam | Reintroduzir como opção recolhida (Fase 2) |
| Escada fixa em vez de FSRS | Previsível, explicável | Menos eficiente por pessoa | Interface `review()` isolada — trocar o algoritmo sem mexer na UI |
| Níveis abertos → todas as missões do nível acessíveis | Menos frustração | Alguns podem saltar ordem | Uma missão "Recomendada" + pré-requisitos avisados na fase Entender |
| Exemplos Xbase com sintaxe VFP genérica | Ensina o padrão (cláusulas de guarda) | Nomes PHC específicos podem variar | Aviso explícito em cada exemplo + "confirmar na ajuda da sua versão" |
