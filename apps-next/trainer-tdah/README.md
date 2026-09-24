# PHC Trainer — edição TDAH

Formação prática no **Cegid PHC Evolution** desenhada para pessoas com TDAH: **um passo de cada vez**, repetição espaçada, exemplos de código resolvidos e zero ruído.

> Reescrita do núcleo pedagógico do [PHC Trainer Pro](https://github.com/brunoacidados/phc-trainer-pro). Análise completa, bugs e decisões: [`docs/DOSSIE-MELHORIAS.md`](docs/DOSSIE-MELHORIAS.md). Material educativo não oficial.

---

## Em 30 segundos

- **Hoje** mostra UMA próxima ação. Clique e faça.
- Cada **missão** tem 4 fases: Entender → Fazer → Provar → Verificar.
- **Praticar**: cartas (sessões de 10) e testes de nível (80% para aprovar).
- Tecla **F** = modo foco. **Definições** = tema claro / escuro / calmo, tamanho de letra, espaçamento.

## Arrancar localmente

```bash
npm install
# .env → DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
npx drizzle-kit push      # cria as 5 tabelas
npm run dev               # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npx vitest run` | 36 testes unitários (SRS, progressão, datas, integridade do conteúdo) |
| `npm exec tsc -- --noEmit` | verificação de tipos |
| `npm run build` | build de produção |
| `node scripts/apply-errata.mjs` | reaplica as correções de conteúdo (idempotente) |

## Estrutura

```
src/
├── app/                     # rotas (Next.js App Router)
│   ├── page.tsx             # Hoje — uma próxima ação + meta diária
│   ├── comecar/             # criar/recuperar perfil (1 ecrã)
│   ├── missoes/             # lista por nível + [id]/MissionRunner (4 fases)
│   ├── praticar/            # cartas (sessão SRS) + testes/[nivel]
│   ├── aprender/            # exemplos de código, glossário, o método
│   ├── progresso/           # nível atual, %, semana, detalhe recolhido
│   ├── definicoes/          # aspeto (dispositivo) + aprendizagem (servidor)
│   └── api/health/          # healthcheck
├── components/              # UI (ui.tsx, AppHeader, Breadcrumbs, prefs, ExampleView…)
├── content/                 # conteúdo pedagógico tipado
│   ├── data/*.json          # missões, teoria, cartas, testes, glossário, níveis
│   ├── examples.ts          # 8 exemplos resolvidos (SQL / Xbase) com fontes
│   └── index.ts             # acessores + cardKey estável
├── domain/                  # regras PURAS (sem BD, sem React) + __tests__
│   ├── srs.ts               # Leitner [1,2,4,7,14,30,60] com lapso corrigido
│   ├── progression.ts       # níveis, próxima ação, % global, pontuação
│   └── dates.ts             # datas ISO com fuso explícito
├── db/schema.ts             # profiles, mission_progress, card_progress, quiz_attempts, activity
└── server/                  # session.ts (cookie), queries.ts, actions.ts (Server Actions)
docs/
├── DOSSIE-MELHORIAS.md      # análise, validação de conceitos, plano, riscos
└── ERRATA.md                # correções de conteúdo com fontes
scripts/apply-errata.mjs
```

### Regras de arquitetura

1. **`domain/` é puro.** Recebe dados, devolve dados. É aqui que ficam as regras de negócio — e é aqui que estão os testes.
2. **Mutações só via `server/actions.ts`.** Cada ação valida a entrada, nunca confia no cliente (a nota dos testes é recalculada no servidor) e regista a micro-ação para a meta diária.
3. **Conteúdo é dados.** Mudar uma missão = editar JSON. Correções factuais vão para `scripts/apply-errata.mjs` + `docs/ERRATA.md` + um teste.
4. **Progresso relacional.** Uma linha por (aluno, missão) e por (aluno, carta). As cartas são identificadas por hash da frente — adicionar cartas não desalinha o progresso.

## Como funciona a aprendizagem

| Técnica | No app | Evidência |
|---|---|---|
| Recordar ativamente | Resposta escondida até "Já pensei" | Roediger & Karpicke (2006) |
| Repetição espaçada | Escada 1→2→4→7→14→30→60 dias; "Errei" volta à caixa 0 | Cepeda et al. (2006); Leitner (1972) |
| Exemplos resolvidos | Problema → frágil → correto → verificar | Atkinson et al. (2000) |
| Um passo de cada vez | Fases, passos 1-a-1, teoria em frases | Cowan (2001); Sweller (1988) |
| Recompensa imediata | ✓ instantâneo, meta diária em pontos | Sonuga-Barke (2003); Hattie & Timperley (2007) |
| Prática com provas | Domínio exige provas + repetições | Ericsson et al. (1993) |

Detalhes e limites de cada técnica: página **Aprender → O método**.

## Decisões de UI/UX (TDAH)

| Decisão | Porquê |
|---|---|
| Uma só ação primária por ecrã | Elimina "por onde começo?" |
| Alternativas recolhidas (máx. 2) | Autonomia sem sobrecarga |
| Divulgação progressiva (`<details>` nativo) | Só o necessário; acessível por teclado sem JS |
| Dias ativos em vez de streak | Falhar um dia não apaga nada → sem vergonha, sem abandono |
| Meta diária pequena (3) | Fácil de começar, fácil de cumprir |
| Tema Calmo | Baixo estímulo: cores dessaturadas, emoji a cinzento, sem animações |
| Texto 18px, entrelinha 1.7, ≤ 68ch, contraste ≥ 7:1 | WCAG 2.2 AAA 1.4.6 / 1.4.8 / 1.4.12 |
| Alvos ≥ 48px, foco visível grosso | WCAG 2.5.5 / 2.4.13 |
| Migalhas de pão em todas as páginas | Recuperar o contexto após uma interrupção |
| Bloqueios dizem porquê e como abrir | Sem becos sem saída |

## Testes sugeridos (próximos)

**E2E (Playwright)**
1. Onboarding: criar perfil → "Hoje" mostra "Começar missão L00".
2. Missão: marcar 2 passos → recarregar → volta à fase Fazer com 2/N.
3. Missão: registar repetição "Fácil" → "Hoje" deixa de propor L00; Missões mostra "Praticada".
4. Cartas: "Errei" numa carta → volta a aparecer no fim da sessão; fim da sessão mostra ecrã de sucesso.
5. Teste: responder a todas → nota igual à calculada no servidor; ≥80% mostra "Aprovado".
6. Definições: tema Calmo persiste após recarregar; tecla F esconde a navegação.
7. Acessibilidade: `@axe-core/playwright` sem violações em todas as rotas, nos 3 temas.

**Integração (Server Actions com BD de teste)**
- `toggleMissionItem` rejeita índices fora do intervalo.
- `markMissionMastered` recusa sem provas completas.
- `submitQuiz` recusa arrays de respostas com tamanho errado.
- `restoreProfile` recusa códigos que não são UUID.

## Limitações conhecidas

- Identificação por cookie + código de recuperação (sem password). Para equipas, portar a autenticação do projeto original.
- Enciclopédia, guia completo, circuitos, trilha de setor, IA e voz ainda não portados (conteúdo intacto no repositório original).
