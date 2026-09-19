# 📌 FAZER-DEPOIS — as SUAS tarefas pendentes

> **Tudo o que podia ser feito em código está feito e testado (Fases 1–4).**
> O que falta exige **as suas contas/decisões** — ninguém mais pode fazer.
> Tempo total estimado: **~45 min de deploy** + período piloto.
> Pode fazer tudo de uma vez ou aos poucos; a ordem abaixo é a recomendada.

---

## ✅ Já implementado (v6.1–6.3)
- Recuperação de password + verificação de email + admin + gestão de membros
- Leaderboard/CSV, drill-down, atribuições c/ prazo, notificações, grupos
- Tema claro/escuro, PWA install, avisos de provider, a11y

## 🔴 1. URGENTE (2 min) — Rodar o token do GitHub

Você colou um token (`ghp_…`) no chat com a IA. Tokens em chats devem ser considerados comprometidos.

1. Abra https://github.com/settings/tokens
2. Encontre o token usado aqui → **Delete** (ou Revoke)
3. Se precisar de um novo para automatizar: **Generate new token (classic)** → scope `repo` → guarde num gestor de passwords

> ⚠️ O histórico do repositório **não** contém o token (nunca foi commitado) — o risco é só o chat.

---

## 🟠 2. Deploy em produção (~30 min, tudo free tier)

Guia detalhado com screenshots mentais em **`docs/DEPLOY.md`**. Resumo:

### 2.1 MongoDB Atlas (~10 min)

1. Criar conta grátis em https://cloud.mongodb.com
2. **Create** → cluster **M0 (free)** → região Iberia/EU-West
3. Database Access → criar utilizador (ex.: `phcapi`) com password forte
4. Network Access → permitir `0.0.0.0/0` (para começar)
5. **Connect → Drivers** → copiar a URI: `mongodb+srv://phcapi:SENHA@cluster0.XXX.mongodb.net/phc-trainer`

### 2.2 API no Render (~10 min — 1 clique graças ao `render.yaml`)

1. https://render.com → **New → Blueprint** → escolher o repo `brunoacidados/phc-trainer-pro`
2. O blueprint cria o serviço sozinho; pede 2 variáveis:
   - `MONGODB_URI` → colar a URI do Atlas (2.1)
   - `CORS_ORIGIN` → deixe provisoriamente `http://localhost:5173`; **volte aqui** após o 2.3 e ponha o URL da Vercel (ex.: `https://phc-trainer-pro.vercel.app`)
3. (JWT ×2 e ENCRYPTION_KEY são **gerados automaticamente** pelo blueprint)
4. Apply → esperar o deploy → testar: `https://<api>.onrender.com/api/health` deve dar `{"ok":true,...,"mongo":true}`

### 2.3 Web na Vercel (~10 min)

1. https://vercel.com → **Add New → Project** → importar o repo
2. **Root Directory: `apps/web`** (a Vercel normalmente deteta; confirme)
3. Env var: `VITE_API_URL=https://<api>.onrender.com`
4. Deploy → abrir `https://<web>.vercel.app` → deve aparecer a página de login
5. **Voltar ao Render (2.2)** e pôr `CORS_ORIGIN=https://<web>.vercel.app` → o Render redeploya

### 2.4 Smoke test pós-deploy (2 min)

```bash
curl https://<api>.onrender.com/api/health
curl https://<api>.onrender.com/api/meta/content-stats   # labs:90, cards:139...
```

Na web: criar conta → cria equipa → ver o código de convite. (A IA só responde depois do passo 3.)

---

## 🟡 3. Configurar a equipa (~10 min)

1. Na v6 (com a sua conta de formador): **👥 Equipa → Criar equipa**
2. **Fornecedores de IA** (aí mesmo, ficam **cifradas no servidor** — só configura 1 vez para todos):
   - ⚡ **Groq** (grátis, rápido): chave em https://console.groq.com/keys
   - 🇧🇷 **Gemini** (grátis — texto **e voz** pt-BR): chave em https://aistudio.google.com → Get API key
   - 🟢 **NVIDIA NIM** (grátis, glm-5.3 para código): chave em https://build.nvidia.com (⚙ → Get API Key)
   - 🌪 Mistral / 🧠 Cerebras / 🔀 OpenRouter: opcionais
3. **Convites**: copiar o **link de convite** (`/entrar/CODE`) ou o código de 8 caracteres e enviar aos técnicos
4. Cada técnico: cria conta → entra automaticamente pela ligação → faz o onboarding (empresa de treino + curso)

---

## 🧠 3b. (Opcional) Ativar o RAG semântico — 1 comando

Deixa o Professor mais fundamentado (busca vetorial da Enciclopédia/esquema/missões em vez de só
palavras-chave). Na raiz do repo, apontando para o **mesmo Atlas** da API:

```bash
MONGODB_URI="mongodb+srv://.../phc-trainer" GEMINI_API_KEY="a-sua-chave-gemini" pnpm --filter @phc/api rag:seed
```

(~4.200 chunks, 1×; precisa da chave Gemini — a mesma do TTS). Detalhes em `docs/DEPLOY.md` §5c.
Sem isto a IA funciona na mesma (fallback por palavras-chave).

## 🟢 4. Piloto com a equipa (1–2 semanas)

Checklist por técnico:

- [ ] Criou conta e entrou na equipa pelo convite
- [ ] Fez o onboarding (segmento → empresa → curso)
- [ ] **Importou o progresso antigo**: no PWA legado ⚙️→💾 Exportar; na v6 ⚙️ Definições → ⬆ Importar do app legado
- [ ] Completou a missão L00 com 1 repetição + 1 evidência
- [ ] Fez 1 sessão de cartas e viu o painel do formador atualizar

Checklist sua (formador):

- [ ] Painel 👥 Equipa mostra todos com progresso correto
- [ ] Botão "Testar"/explicações 🧠 respondem (chaves IA ok)
- [ ] Voz 🔊 funciona (chave Gemini)
- [ ] De olho: logs do Render · erros no Sentry (se configurou, `docs/DEPLOY.md` §4) · uso no Atlas (free: 512MB)

---

## 🔵 5. Ativar o banner de migração no legado (2 min)

O banner **já está embutido** no `index.html` legado (adormecido) e o service worker já foi atualizado (v15). Para ligar:

1. Editar **`migrate.json`** (raiz do repo):
   ```json
   {
     "enabled": true,
     "url": "https://<web>.vercel.app",
     "message": "...",
     "cta": "Migrar para a v6 →"
   }
   ```
2. `git commit -am "feat: ativar banner de migração v6" && git push`
3. Em ~1 min o GitHub Pages serve o banner no site antigo (cada utilizador vê-o uma vez por sessão, pode fechar com ✕)

---

## 🟣 6. Corte final (só após o piloto estar estável)

- [ ] Todos os utilizadores ativos migrados (importaram o progresso)
- [ ] 2–4 semanas de banner ativo sem problemas
- [ ] Decidir: **desligar o GitHub Pages** (Settings → Pages → Source: None) — a v6 na Vercel passa a ser a aplicação
- [ ] (Opcional) Domínio próprio na Vercel + atualizar links partilhados
- [ ] (Opcional) `git mv index.html sw.js manifest.webmanifest icons assets worker migrate.json version.json legacy/` para arrumar a raiz — **só depois** de desligar o Pages

---

## 🧪 Verificar tudo localmente antes/depois (opcional mas recomendado)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # deixar como está (defaults de dev funcionam)

# subir Mongo em memória + API + web (3 terminais ou:)
pnpm --filter @phc/api mongo:dev &       # Mongo local grátis, sem instalar nada
pnpm dev                                  # api :4000 + web :5173

# qualidade
pnpm lint && pnpm typecheck && pnpm test  # 46+ testes unitários
node scripts/api-flow-test.mjs            # 39 verificações do fluxo completo (com api+mongo no ar)
pnpm build && pnpm test:e2e               # 6 E2E com browser (requer ~2GB RAM livres)
```

## 📚 Onde está tudo documentado

| Ficheiro              | Conteúdo                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| `FAZER-DEPOIS.md`     | **este documento**                                                        |
| `docs/DEPLOY.md`      | deploy passo-a-passo (Atlas/Render/Vercel/Sentry/Docker)                  |
| `docs/ARQUITETURA.md` | decisões técnicas, modelo de dados, API, segurança                        |
| `docs/MIGRACAO.md`    | estado da migração por funcionalidade + plano das fases + plano das fases |
| `docs/LEGADO-v5.md`   | README da v5 (PWA antigo)                                                 |
| `README.md`           | visão geral + arranque rápido                                             |

## 🆘 Problemas comuns

| Sintoma                           | Causa/solução                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| API 500 no arranque (Render)      | `MONGODB_URI` errado ou Network Access do Atlas não permite o IP (ponha `0.0.0.0/0` no free tier) |
| Web: "Falha na chamada de IA"     | Falta colar ≥1 chave de IA em 👥 Equipa (Groq/Gemini são grátis)                                  |
| Web chama a API e dá erro de CORS | `CORS_ORIGIN` no Render ≠ URL exato da Vercel (com https, sem barra no fim)                       |
| 1º pedido à API demora ~1 min     | Cold start do free tier do Render (normal; depois aquece)                                         |
| Voz não fala                      | Chave Gemini ausente, ou provedor em "Navegador" (Edge tem vozes naturais melhores)               |
| Refresh/Login expira sempre       | `JWT_REFRESH_SECRET` mudou entre deploys (não mude; se mudar, todos voltam a entrar)              |

---

**Quando terminar os passos 2–3, a v6 está em produção para a sua equipa.** 🎓
Qualquer dúvida durante o processo, pergunte aqui no chat — guio passo a passo.
