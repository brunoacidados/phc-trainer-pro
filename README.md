# 🧠 PHC Trainer Pro — Formação Profissional · Gestão Cegid PHC Evolution

> Plataforma **multiutilizador** de formação prática para dominar o módulo **Gestão do Cegid PHC Evolution / PHC CS Desktop**: 90 missões passo-a-passo num PHC real, **tutor de IA** (auto-router de 6 fornecedores, agora **no servidor**), flashcards com repetição espaçada, testes por nível, portefólio de evidências e **painel de progresso de equipa** — com contas, autenticação e dados guardados na cloud.

**Material educativo não oficial**, baseado em fontes públicas da Cegid PHC. _Cegid PHC® é marca dos respetivos proprietários — projeto sem afiliação._

---

## 🏗 v6 — a versão multiutilizador (em desenvolvimento)

A v5.x era um PWA estático de ficheiro único (progresso no `localStorage` de cada navegador — a "equipa" comparava-se exportando JSON). A **v6 transforma o projeto numa aplicação moderna para equipas**:

| Camada    | Tecnologia                                                                                                                                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linguagem | **TypeScript** (strict) em todo o monorepo                                                                                                                                                                                                                       |
| Frontend  | **React 19 + Vite** · **Tailwind CSS 4** (componentes estilo shadcn/ui) · **React Router 7** · **TanStack Query 5** · **Zustand 5** · **React Hook Form + Zod**                                                                                                  |
| Backend   | **Node.js + Express 5** (promises nativas)                                                                                                                                                                                                                       |
| BD        | **MongoDB Atlas** (free M0) via **Mongoose 9**                                                                                                                                                                                                                   |
| Auth      | **JWT** — access curto em memória + refresh com **rotação** (cookie httpOnly e/ou header), bcrypt, detecção de reutilização de token                                                                                                                             |
| Validação | **Zod 4** — os mesmos schemas no cliente e no servidor (`@phc/shared`)                                                                                                                                                                                           |
| IA        | **Auto-router no servidor** (Groq → Gemini → NVIDIA → Mistral → Cerebras → OpenRouter) com cooldown/retry — **chaves cifradas (AES-256-GCM) na equipa**, nunca no navegador. Sem CORS: a NVIDIA funciona direta, **o proxy Cloudflare deixou de ser necessário** |
| Testes    | **Vitest** (unitários: SRS, conquistas, crypto, JWT, router) + **Supertest** (API) + **Playwright** (E2E)                                                                                                                                                        |
| Qualidade | **ESLint 9 + Prettier + Husky + lint-staged** · **GitHub Actions** (lint, typecheck, testes, build)                                                                                                                                                              |
| Gestor    | **pnpm workspaces**                                                                                                                                                                                                                                              |
| Deploy    | Web: **Vercel/Cloudflare Pages** · API: **Render/Railway** · BD: **Atlas** · Erros: **Sentry** (opcional)                                                                                                                                                        |
| Legado    | O PWA v5.3 continua publicado em https://brunoacidados.github.io/phc-trainer-pro/ (ficheiros na raiz; guia em `docs/LEGADO-v5.md`)                                                                                                                               |

### Estrutura do monorepo

```
phc-trainer-pro/
├── apps/
│   ├── api/                    # Express 5 + Mongoose (auth, progresso, equipas, IA, TTS)
│   └── web/                    # React 19 + Vite + Tailwind (SPA)
├── packages/
│   ├── content/                # @phc/content — TODO o conteúdo pedagógico extraído do legado
│   │   └── src/data/*.json     #   90 missões · 139 cartas · 13 testes · enciclopédia · guia 15 cap.
│   └── shared/                 # @phc/shared — schemas Zod, motor SRS, conquistas, prompts de IA
├── scripts/extract-legacy-content.mjs   # extrator legado → content (reprodutível)
├── docs/                       # ARQUITETURA · DEPLOY · MIGRACAO · LEGADO-v5 · guia expert
├── .github/workflows/ci.yml    # CI: lint + typecheck + test + build
├── index.html, sw.js, assets/… # ⚠️ app legado v5.3 (GitHub Pages) — não mexer até ao corte final
└── worker/                     # proxy Cloudflare (só o legado usa)
```

### 🚀 Arranque local (5 min)

```bash
# pré-requisitos: Node ≥ 20.19, pnpm 10 (corepack enable), MongoDB local ou Atlas
pnpm install
cp apps/api/.env.example apps/api/.env      # preencha MONGODB_URI + segredos
pnpm dev                                     # api :4000 + web :5173 (proxy /api incluído)
```

Abra http://localhost:5173 → **Criar conta** → **Equipa** → _crie a equipa_ (formador) ou _entre com o código_ (técnico).

> **Fluxo de equipa:** o formador cria a equipa, cola as chaves de IA uma vez (Definições da equipa — ficam cifradas no servidor) e partilha o código de convite de 8 caracteres. Cada técnico cria conta, entra com o código e treina; o formador acompanha tudo no painel comparativo (cinto, %, 🧠, reps, testes, provas, streak, XP, última atividade).

### ✅ O que já funciona na v6

- Contas + JWT com rotação de refresh tokens · equipas com código de convite
- Progresso por utilizador **no servidor** (SRS 1→2→4→7→14→30→60, evidências, conquistas automáticas no servidor)
- Jornada · Missões (lista guiada + detalhe completo: conceito, passos, provas, perguntas, evidências, repetição cronometrada, "sei de cor")
- Aprender: Circuitos · Dicionário (94) · **Enciclopédia** (pesquisa global) · Guia completo · **Gerador de código** (descoberta guiada + confiança ≥99% + "📐 O meu esquema" na conta)
- Praticar: Cartas SRS · Testes de nível (≥80%)
- Equipa: painel comparativo do formador · chaves de IA cifradas · estado dos fornecedores
- IA: chat/explicações com persona Professor Einstein + contexto da empresa/país/gama + mini-RAG da Enciclopédia — router no servidor
- Voz: TTS via servidor (Gemini/ElevenLabs/Groq) com cache IndexedDB + fallback navegador
- **Modo Foco**: wizard passo-a-passo (🔊 ouvir → 🧠 explicar → ✅ feito) → provas → perguntas → repetição
- **Mascote Professor Einstein**: SVG animado (pisca, fala, "pensa" nas chamadas de IA, festeja), dicas por página, clique abre o **chat global** com contexto da missão
- **Aula guiada**: explicação parágrafo-a-parágrafo com voz, auto-avanço, cache e modo económico
- **Onboarding/entrevista de IA**: wizard 4 passos (segmento → empresa → objetivos → curso) que gera o plano personalizado (com fallback offline por segmento); abre automaticamente na 1ª sessão
- **Protocolo de treino** (regras, metas de tempo, áudio de boas-vindas) + export CSV das provas
- **Importação do progresso do app legado** (Definições → 💾 Importar) e exportação JSON
- **Convite por link** (`/entrar/CODE`) + código de 8 caracteres
- **PWA instalável + offline-first** (vite-plugin-pwa): shell em cache, snapshot local do progresso, **fila de sincronização** — ações offline são guardadas e repetidas por ordem ao reconetar, com indicador 📴/☁️ no topo
- 40 testes unitários/API + **validação HTTP de 39 pontos do fluxo completo** (`scripts/api-flow-test.mjs`) + **6 E2E Playwright** no CI · Sentry (api+web) pronto · deploy pronto: `render.yaml` (blueprint 1-clique), `apps/api/Dockerfile`, `apps/web/vercel.json`

### 🛣 Próximos passos (ver docs/MIGRACAO.md)

✅ **Fase 2 concluída** (Modo Foco · mascote · aula guiada · onboarding/entrevista · protocolo · CSV)
✅ **Fase 3 concluída** (deploy blueprint/Docker/Vercel · E2E no CI · convite por link · Sentry · hardening)
✅ **Fase 4 concluída** (PWA/offline na v6 · fila de sync · banner de migração no legado via `migrate.json` · corte preparado)
**Resta (só o dono do projeto):** executar deploy + piloto + corte — checklist em **`FAZER-DEPOIS.md`**.

### 📄 Licença

[MIT](LICENSE) — sem evidência, não há aprendizado.

### 📕 Atribuição

Inclui índice destilado da Enciclopédia PHC® (descrições resumidas/reescritas, com atribuição à Cegid/PHC — o original permanece no CHM/Help Center oficial).
