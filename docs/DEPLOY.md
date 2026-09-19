# 🚀 Deploy — PHC Trainer Pro v6 (100% free tier)

Alvo: **Web na Vercel** (ou Cloudflare Pages) · **API no Render** (ou Railway) · **MongoDB Atlas M0** · **Sentry free** (opcional).

## 1. MongoDB Atlas (5 min)

1. https://cloud.mongodb.com → **Create** → cluster **M0 free** (região EU-West/Iberia).
2. Database Access → utilizador `phcapi` com password forte.
3. Network Access → `0.0.0.0/0` (free tier não tem VPC; aceite para começar) ou o IP do Render.
4. **Connect → Drivers** → copie a URI:
   `mongodb+srv://phcapi:<password>@cluster0.xxxxx.mongodb.net/phc-trainer`
5. GUI: **MongoDB Compass** (desktop) ou Data Explorer no site.

## 2. API no Render

### Opção A — Blueprint (recomendado, 1 clique)

https://render.com → **New → Blueprint** → escolher o repo → o `render.yaml` na raiz cria o
serviço com healthcheck, segredos gerados automaticamente (JWT ×2 + ENCRYPTION_KEY) e as
variáveis marcadas `sync: false` para preencher: **MONGODB_URI** e **CORS_ORIGIN**.

### Opção B — manual

1. https://render.com → **New → Web Service** → repo `brunoacidados/phc-trainer-pro`.
2. Configuração:
   - **Root Directory:** `apps/api`
   - **Runtime:** Node 22 · **Build:** `corepack enable && pnpm install` (ou `pnpm install` se já tiver pnpm)
   - **Start:** `pnpm start` (tsx src/index.ts)
   - **Env vars:**
     ```
     NODE_ENV=production
     PORT=10000                      # Render injeta; o código usa 4000 por omissão
     MONGODB_URI=mongodb+srv://...
     JWT_ACCESS_SECRET=<aleatório 48B base64url>
     JWT_REFRESH_SECRET=<aleatório 48B base64url>
     ENCRYPTION_KEY=<aleatório 48B base64url>
     CORS_ORIGIN=https://<a-sua-web>.vercel.app
     SENTRY_DSN=            (opcional)
     AI_KEY_GROQ=           (opcional — chaves globais de fallback)
     ```
     Gere segredos com: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
3. Deploy → teste `https://<api>.onrender.com/api/health` → `{"ok":true,...,"mongo":true}`.

> **Alternativa Railway/Docker:** o repositório inclui `apps/api/Dockerfile` (imagem node:22-slim,
> runtime tsx, healthcheck integrado). Railway: New Project → repo →Detetar Dockerfile → variáveis.
> Build local: `docker build -f apps/api/Dockerfile -t phc-api . && docker run --rm -p 4000:4000 --env-file apps/api/.env phc-api`

## 3. Web na Vercel

1. https://vercel.com → **Add New → Project** → importar o repo.
2. **Framework:** Vite · **Root Directory:** `apps/web`.
3. **Env vars:** `VITE_API_URL=https://<api>.onrender.com` · `VITE_SENTRY_DSN` (opcional).
4. Deploy. A Vercel deteta o workspace pnpm automaticamente.

> **Alternativa Cloudflare Pages:** build command `pnpm --filter @phc/web build`, output `apps/web/dist`.

⚠️ **Cookies cross-site:** com web e API em domínios diferentes, o refresh por cookie exige
`SameSite=None; Secure` (já configurado em produção). O cliente também guarda o refresh token em
localStorage e envia-o por header — funciona mesmo onde cookies 3rd-party são bloqueados (Safari).

## 4. Sentry (opcional, free)

1. sentry.io → dois projetos: `phc-api` (Node/Express) e `phc-web` (React).
2. `SENTRY_DSN` no Render · `VITE_SENTRY_DSN` na Vercel. Sem DSN, nada é inicializado.

## 5. Testes antes/depois do deploy

```bash
# unitários + build (rápido)
pnpm test && pnpm build

# validação HTTP do fluxo completo (39 verificações: auth, equipas, SRS, chaves cifradas,
# rotação de tokens, import legado) — sobe Mongo em memória + API automaticamente
pnpm --filter @phc/api mongo:dev &   # ou Mongo local/Atlas via MONGODB_URI
node scripts/api-flow-test.mjs

# E2E Playwright (6 testes com browser real; requer `pnpm build` antes e ~2 GB RAM livres)
pnpm --filter @phc/web exec playwright install --with-deps chromium   # 1ª vez
pnpm test:e2e
```

## 5b. Testar as chaves de IA que configurou

Depois de colar as chaves em **👥 Equipa → Fornecedores de IA**, tem 3 formas de testar:

**A) Na app (mais fácil):** no cartão "Fornecedores de IA" clique **🔬 Testar todos**.
Cada fornecedor mostra o resultado em tempo real:

- `✔ respondeu em 640 ms · openai/gpt-oss-120b` → chave boa
- `✘ HTTP 401 · invalid api key` → chave errada/expirada
- `— sem chave` → não configurado

**B) Teste real de uso:** abra uma missão → **🧠 Explicar** (ou o chat do mascote). Se responder,
o router está a funcionar; se todas as chaves falharem devolve `502` com o diagnóstico de cada uma.

**C) Por HTTP (curl/terminal)** — precisa de um token de acesso:

```bash
# token = accessToken devolvido pelo login (ou pelo /api/auth/refresh)
curl -X POST https://<api>.onrender.com/api/ai/test \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" -d '{}'
# → {"ok":2,"tested":6,"withKey":2,"results":[{"id":"groq","ok":true,"ms":640,...}, ...]}

# testar só um fornecedor:
curl -X POST https://<api>.onrender.com/api/ai/test \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" -d '{"id":"gemini"}'
```

> Notas: o teste faz um pedido mínimo ("responda OK") a cada fornecedor — gasta o equivalente a
> 1 chamada pequena por chave. Não altera os cooldowns do router, pode repetir à vontade.
> A **voz (TTS)** testa-se em ⚙️ Definições → 🔊 "Testar voz" (usa a chave Gemini/ElevenLabs).

## 5b-2. Configurar EMAIL (recuperação de password + verificação) — OBRIGATÓRIO p/ equipa

O erro **Resend 403** ("only send testing emails to your own email") acontece porque o from
default `onboarding@resend.dev` só envia p/ o dono da conta. Duas soluções:

**OPÇÃO A — SMTP do Gmail (funciona JÁ, sem verificar domínio):**

1. Em https://myaccount.google.com/apppasswords cria uma **app password** (precisa de 2FA ativo).
2. No Render (serviço da API) define:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=oseuemail@gmail.com
   SMTP_PASS=<app-password>
   EMAIL_FROM=PHC Trainer Pro <oseuemail@gmail.com>
   APP_URL=https://phc-trainer-pro-web.vercel.app
   ```
3. Redeploy. Testa "Esqueci-me da password" — deve chegar a qualquer destinatário.

**OPÇÃO B — Resend com domínio próprio (recomendado p/ produção):**

1. Em https://resend.com/domains adiciona um domínio teu e confirma os registos DNS (SPF/DKIM/MX).
2. No Render: `RESEND_API_KEY=re_...`, `EMAIL_FROM=noreply@oteudominio.com`, `APP_URL=<url web>`.
   (Não definas SMTP_* para usar Resend.)
3. Redeploy.

**Sempre:** define `APP_URL` = URL público da **web** (senão os links vão p/ localhost).
Diagnóstico em tempo real: **🛡 Admin → Estado do email** (diz a causa exata e a correção).
Fallback sem email: Admin → por utilizador → 🔑 link de reset / 🛡 password temporária / ✉ verificar.

## 5c. Ativar o RAG semântico (opcional, recomendado — 1 comando)

O tutor de IA já funciona sem isto (usa mini-RAG por palavras-chave). Para a **busca semântica**
(embeddings da Enciclopédia + esquema + missões), corra o seed **uma vez** a partir da sua máquina,
apontando para o **mesmo Atlas** da API:

```bash
# na raiz do repo
MONGODB_URI="mongodb+srv://.../phc-trainer" \
GEMINI_API_KEY="a-sua-chave-gemini" \
pnpm --filter @phc/api rag:seed
```

- Gera ~4.200 chunks e guarda-os na coleção `chunks` do Atlas (a API lê-os em runtime).
- Precisa de uma chave **Gemini** (a mesma do TTS serve) — usa o modelo `text-embedding-004`.
  Alternativa: `OPENROUTER_API_KEY` (usa `text-embedding-3-small`).
- Idempotente: pode repetir. Em runtime, a API embedda a pergunta com a chave Gemini **da equipa**
  (👥 Equipa → Fornecedores de IA) — portanto configure essa chave para o RAG funcionar online.
- Ver estado: `GET /api/ai/rag` (autenticado) → `{chunks, sources}`. Sem chunks, cai no fallback por palavras-chave.

> Validar a construção sem gastar embeddings: `DRY_RUN=1 pnpm --filter @phc/api rag:seed`.

## 6. Smoke test pós-deploy

```bash
curl https://<api>.onrender.com/api/health
curl https://<api>.onrender.com/api/meta/content-stats   # labs:90, cards:139...
# na web: criar conta → criar equipa → colar 1 chave (Groq grátis) → 🧠 Explicar numa missão
```

## 7. Convites por link

O formador copia em 👥 Equipa o **link de convite** `https://<web>/entrar/CODE`. Quem abrir:
com sessão → entra automaticamente na equipa; sem sessão → registo preservando o código
(`?join=CODE`) e entrada automática no fim.

## 8. Legado (GitHub Pages)

O PWA v5.3 continua publicado a partir da **raiz do repo** (Settings → Pages → main / root).
Mantenha-o até ao corte final da v6 (ver `docs/MIGRACAO.md`). Depois do corte: mover legado
para `legacy/` ou desligar o Pages e servir tudo da Vercel.

## Operação

- **Backups:** Atlas free faz snapshots diários (7 dias). Export adicional: cada utilizador pode
  exportar o seu progresso em JSON (Definições → 💾).
- **Rotação de chaves de IA:** Equipa → Fornecedores de IA (formador) — cifrado em repouso.
- **Rotação de ENCRYPTION_KEY:** invalida as chaves de equipa guardadas (voltar a colá-las).
- **Logs:** Render → Logs do serviço; erros Sentry.
