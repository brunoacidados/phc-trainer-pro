# 🏛 Arquitetura — PHC Trainer Pro v6

## Visão geral

```
┌────────────────────┐        HTTPS/JSON         ┌──────────────────────┐
│  apps/web (SPA)    │ ────────────────────────▶ │  apps/api (Express5) │
│  React 19 + Vite   │   access token (memória)  │  + Mongoose 9        │
│  Tailwind 4        │   refresh (cookie/LS)     │                      │
│  TanStack Query    │                           │  services/aiRouter ──┼──▶ Groq/Gemini/NVIDIA/
│  Zustand           │                           │  services/tts ───────┼──▶ Mistral/Cerebras/OR
└─────────┬──────────┘                           └──────────┬───────────┘
          │ importa                                          │ importa
          ▼                                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ packages/shared — schemas Zod (contratos), SRS, conquistas, │
   │                   prompts/persona, helpers de empresa       │
   ├─────────────────────────────────────────────────────────────│
   │ packages/content — dados pedagógicos (JSON tipado):         │
   │   114 missões · teoria · 188 cartas · 17 testes · 12 segmentos│
   │   dicionário · circuitos · países · enciclopédia · esquema  │
   │   BD · guia 15 cap. · conquistas · vozes · prompts de IA    │
   └─────────────────────────────────────────────────────────────┘
                        │
                        ▼
              MongoDB Atlas (M0) — users, teams, progress, refreshtokens
```

## Decisões

### 1. Conteúdo é código; progresso é base de dados

Missões/enciclopédia/guia mudam por release (revisão editorial), não por utilizador → vivem em
`@phc/content` (versionado, tipado, testável, cacheável no bundle). Dados por utilizador
(progresso, evidências, equipas, chaves) vivem no MongoDB. Consequência: zero seed scripts,
zero migrações de conteúdo; o servidor e o cliente partilham exatamente o mesmo conteúdo.

### 2. Contratos únicos com Zod (`@phc/shared`)

O mesmo schema valida o formulário (react-hook-form + zodResolver), o body na API
(middleware `validate`) e tipa as respostas (`z.infer`). `z.input` para clientes (defaults
opcionais), `z.infer` para o servidor (defaults aplicados).

### 3. Autenticação JWT com rotação de refresh

- **Access token** (15 min): só em memória no cliente — nunca em storage.
- **Refresh token** (30 dias): cookie httpOnly (`phc_rt`, path `/api/auth`) **e** body/localStorage
  (fallback cross-origin, onde cookies 3rd-party são bloqueados). Guardamos apenas o **sha256**
  na coleção `refreshtokens` (TTL automático).
- **Rotação**: cada refresh revoga o token usado e emite novo par. Reutilização de token revogado
  (possível roubo) → revoga **todos** os tokens do utilizador.
- Passwords: bcrypt (10 rounds). Change-password revoga todas as sessões.

### 4. IA no servidor (o salto da v5 → v6)

Na v5, o router de 6 fornecedores corria no navegador: chaves por utilizador em localStorage,
CORS a bloquear a NVIDIA (daí o worker/proxy), rate limits visíveis. Na v6:

- **Chaves da equipa** configuradas 1× pelo formador, **cifradas em repouso** (AES-256-GCM com
  `ENCRYPTION_KEY`), nunca enviadas ao navegador (a UI vê apenas `****last4`).
- Fallback: chaves globais por variável de ambiente (`AI_KEY_*`).
- **Sem CORS**: o servidor chama a NVIDIA diretamente — o proxy Cloudflare torna-se opcional/legado.
- O router mantém a semântica testada da v5: ordem (configurável por equipa), cooldown por
  erro (401/402/403 → 3h; 429 → 3min com 1 retry após 1.6s; rede → 90s), preferência de
  modelos de código (`code:true` → NVIDIA glm-5.3 → Codestral).
- **Prompt de sistema injetado no servidor** (persona Professor Einstein + empresa de treino +
  país/gama + plano + contexto da missão) — o cliente não consegue "esquecer" a persona.
- Cache de explicações no cliente (localStorage) por hash — o mesmo parágrafo não gasta 2×.

### 4b. RAG semântico (P4) — busca vetorial sem depender de tier pago

O conteúdo é embeddado uma vez (`pnpm --filter @phc/api rag:seed`, Gemini `text-embedding-004` ou
OpenAI `text-embedding-3-small`) para a coleção `chunks` (~4.200). Em runtime a API embedda a
pergunta e faz **cosseno em memória** (top-k) — rápido para milhares de vetores e **funciona em
qualquer Mongo, incluindo Atlas M0 free** (não exige Vector Search index; o upgrade é transparente).
Sem chunks ou sem chave de embeddings, cai automaticamente no mini-RAG por palavras-chave (`encContext`).

### 5. SRS e conquistas autoritativos no servidor

`registerLabRep`, `rateCard`, `submitQuiz`, `applyAchievements` correm na API (código partilhado
em `@phc/shared`, testado). O cliente só mostra o estado devolvido. Vantagem: o painel de equipa
é consistente e à prova de localStorage limpo.

### 6. Estado no cliente

- **TanStack Query**: dados de servidor com identidade própria (dashboard de equipa, fornecedores).
- **Zustand**: sessão (auth) e progresso (cache local do documento + ações que chamam a API e
  substituem o estado pela resposta do servidor — otimista o suficiente, simples de raciocinar).

### 7. Monorepo pnpm sem build dos packages

`@phc/content` e `@phc/shared` exportam **fonte TS** (exports map → `./src/index.ts`):
Vite bundla, tsx executa, Vitest importa — sem passo de compilação intermédio, sem drift.
Typecheck por pacote (`tsc --noEmit`) garante a integridade.

## Modelo de dados (MongoDB)

| Coleção         | Campos principais                                                                    | Notas                                   |
| --------------- | ------------------------------------------------------------------------------------ | --------------------------------------- |
| `users`         | name, email (unique), passwordHash, role (student/trainer), teamId, lastActiveAt     | `toPublicUser()` nunca expõe o hash     |
| `teams`         | name, ownerId, inviteCode (unique, 8 chars sem ambíguos), aiKeys (cifradas), aiOrder | formador roda o código quando quiser    |
| `progress`      | userId (unique), **state** (ProgressState completo)                                  | espelha o `S` do legado → import direto |
| `refreshtokens` | userId, tokenHash (sha256, unique), expiresAt (TTL), revokedAt, userAgent            | rotação + auditoria                     |

`ProgressState` (contrato em `@phc/shared`): labs (c/due/mem/steps/proofs/hist/timed), cards,
quiz, evid[], streak, daily, stats, achs, company (empresa de treino), plan (curso personalizado),
contexto (país/gama), settings (voz/UX — **sem segredos**), aiCache, dbSchema ("📐 O meu esquema").

## API (resumo)

```
POST   /api/auth/register|login|refresh|logout|change-password     GET/PATCH /api/auth/me
GET    /api/progress                                               PUT /api/progress (merge)
POST   /api/progress/reps|steps|proofs|mastered|evid|cards/rate|quiz|company|contexto|settings
GET    /api/teams/mine            POST /api/teams | /api/teams/join | /api/teams/leave
GET    /api/teams/:id/dashboard   (formador)   POST /api/teams/:id/rotate-invite
GET/PUT /api/teams/:id/ai-settings (formador — chaves cifradas)
POST   /api/ai/chat   (router multi-fornecedor; persona+contexto+RAG injetados)
POST   /api/ai/chat-stream (igual, em SSE: eventos token/done/error; fallback só antes do 1º token)
POST   /api/ai/tts    (gemini/elevenlabs/groq → base64; cliente faz cache IDB)
GET    /api/chat · DELETE /api/chat   (histórico persistente do Professor, coleção chathistories)
GET    /api/ai/rag    (estado da base semântica: chunks por origem)
GET    /api/ai/providers       (estado: configurado? origem? em pausa?)
POST   /api/ai/test            (testa chaves: {} = todos, {id} = um; devolve ok/latência/erro por fornecedor)
POST   /api/meta/import-legacy    GET /api/meta/content-stats   POST /api/meta/reset
GET    /api/health
```

Erros: `{error, details?}` com status coerente (400 Zod · 401/403 · 404 · 409 duplicados · 413 ·
502 todos-os-fornecedores-falharam). Rate limits: 300/min global, 30/15min auth, 40/min IA.

## Segurança (checklist)

- ✅ Segredos só no servidor (env + AES-256-GCM para chaves de equipa)
- ✅ Hash de passwords (bcrypt) · hash de refresh tokens (sha256) · rotação + revogação em cascata
- ✅ helmet · CORS allowlist · rate limits · body limit 3MB
- ✅ Validação Zod em todos os inputs · `trust proxy` para IP real atrás de PaaS
- ✅ Em produção, arranque falha se os segredos forem os de desenvolvimento
- ⚠️ TODO: audit log de ações de equipa · CSP no web · verificação de e-mail
