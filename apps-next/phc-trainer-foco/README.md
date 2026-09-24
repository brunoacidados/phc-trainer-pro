# PHC Trainer — Foco (edição TDAH)

Formação prática em **Cegid PHC** desenhada à volta de uma ideia: **uma ação de cada vez**.
Next.js 16 (App Router) · PostgreSQL + Drizzle ORM · Tailwind CSS 4 · Vitest.

> Material educativo não oficial, baseado em fontes públicas da Cegid PHC. Cegid PHC® é marca dos respetivos proprietários.

---

## Em 30 segundos

| Ecrã | O que faz | Porquê (TDAH) |
|---|---|---|
| **Hoje** | Mostra **uma** próxima ação, com o motivo e o tempo estimado | Elimina a decisão "por onde começo?" |
| **Missão** | 6 etapas curtas, uma por ecrã (`?etapa=1..6`) | Memória de trabalho ≈ 4 blocos (Cowan, 2001) |
| **Cartas** | Sessões de no máximo 10, cada botão diz quando a carta volta | Fim à vista + sistema previsível |
| **Testes** | Uma pergunta por ecrã, explicação imediata | Feedback imediato |
| **Código** | 8 exemplos *errado → certo → porquê* (tratamento de erros, segurança) | Exemplos resolvidos reduzem carga cognitiva |
| **Preferências** | Temas claro/escuro/**calmo**, 3 tamanhos de texto, reduzir movimento, modo foco | Controlo do estímulo |

## Arranque

```bash
npm install
# .env → DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
npx drizzle-kit push        # cria as 5 tabelas
npm run dev                 # http://localhost:3000
```

Não há registo: um cookie anónimo (`phc_uid`) identifica o aluno. O progresso fica na base de dados.

## Testes e validação

```bash
npx vitest run                          # 34 testes: domínio (SRS, progressão, datas) + integridade do conteúdo + errata
npm exec tsc -- --noEmit                # tipos
npx eslint src                          # lint
npm run build                           # build de produção
node scripts/apply-errata.mjs           # reaplica a errata (idempotente) se o conteúdo for reimportado
```

## Estrutura

```
src/
├── app/                      # rotas (Server Components por omissão)
│   ├── page.tsx              #   Hoje — uma próxima ação
│   ├── trilha/[nivel]/       #   níveis → missões
│   ├── missao/[id]/          #   6 etapas (?etapa=N)
│   ├── praticar/cartas|testes#   SRS + testes de nível
│   ├── exemplos/[slug]/      #   exemplos de código resolvidos
│   ├── glossario, progresso, metodo, preferencias
│   └── api/health/           #   healthcheck (SELECT 1)
├── components/               # UI; *.tsx com "use client" só onde há interação
├── content/                  # conteúdo pedagógico (JSON do repo original + errata) e exemplos de código
├── domain/                   # REGRAS PURAS: srs.ts, progression.ts, dates.ts (+ __tests__)
├── server/                   # session (cookie), queries (leitura), actions (escritas validadas)
├── db/                       # Drizzle: schema normalizado (1 linha por missão/carta)
└── proxy.ts                  # emite o cookie anónimo no 1.º pedido
scripts/apply-errata.mjs      # correções de conteúdo reprodutíveis
docs/DOSSIE-MELHORIAS.md      # análise completa + decisões
docs/ERRATA.md                # cada correção com fonte
```

### Regra de dependências
`app → components → server → domain/content`. **`domain/` não importa nada de React, Next ou BD** — é por isso que é 100% testável.

## Modelo de dados

| Tabela | Chave | Conteúdo |
|---|---|---|
| `learners` | id (uuid) | aluno anónimo |
| `mission_progress` | (learner, mission) | passos, provas, repetições, próxima data, domínio |
| `card_progress` | (learner, card) | caixa Leitner, próxima data, lapsos |
| `quiz_attempts` | serial | tentativas pontuadas **no servidor** |
| `activity` | serial | micro-ações por dia (meta diária, dias ativos) |

## Regras de aprendizagem (resumo)

- **Escada**: 1, 2, 4, 7, 14, 30, 60 dias. Carta falhada → volta à caixa 0. "Com esforço" → repete o intervalo.
- **Repetição de missão** só avança a escada se estiver vencida (repetir 5× na mesma tarde não é espaçar).
- **Domínio** exige todas as provas + 2 repetições em dias diferentes (validado no servidor).
- **Meta diária**: 3 micro-ações. Mostra "dias ativos em 7", nunca uma sequência que parte.

Detalhe e fontes: página **/metodo** na app e `docs/DOSSIE-MELHORIAS.md`.
