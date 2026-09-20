# 📌 FAZER DEPOIS — pendências do teu lado + melhorias futuras

A plataforma v6 está funcional e deployed. Itens abaixo precisam do **teu ambiente** (chaves/env/contas) ou são melhorias opcionais.

## 🔴 Ação necessária (teu lado) — para funcionalidades completas
1. **RAG semântica (seed)** — tutor IA com contexto do guia:
   ```bash
   cd apps/api
   MONGODB_URI="mongodb+srv://user:pass@cluster/mongodb?retryWrites=true&w=majority" \
   GEMINI_API_KEY="AIza..." \
   corepack pnpm rag:seed
   ```
   (re-executa se o `docs/guia-expert-phc-gestao-evolution.md` mudar). Sem seed, o chat usa fallback por palavra-chave.
2. **Emails (Render env)** — escolhe SMTP **ou** Resend com domínio próprio:
   - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (+`EMAIL_FROM`, `APP_URL=https://phc-trainer-pro-web.vercel.app`).
   - Resend: `RESEND_API_KEY` + `EMAIL_FROM=notificações@teudominio.com` (domínio verificado). **Nunca** `onboarding@resend.dev` p/ outros destinatários.
   - Testa: `GET /api/admin/email-status`; reenvia: POST `/api/admin/email-status/send`.
3. **Cutover final do legado** → `docs/CUTOVER.md` (+ `scripts/cutover.sh`) quando a equipa migrar.
4. **Rodar tokens GitHub** (o token usado para push está no histórico/chat).
5. **otimizar `apps/web/public/og.png`** (4.2MB → <1MB; ex.: `npx sharp-cli` ou online) — já está excluído do precache offline.

## 🟡 Imagens (opcional, tua conta pro)
- **PNGs fotorrealistas dos níveis** a partir de `docs/PROMPTS-IMAGENS.md` (o gerador aqui é rate-limited; os SVG ilustrativos em `apps/web/public/img/guia/` já servem de fallback). Coloca como `apps/web/public/img/guia/lvlN.png` (o `LevelImage` prefere PNG).

## 🟢 Melhorias futuras (deferidas — o essencial está feito)
- **i18n EN completo**: scaffold PT/EN existe (`apps/web/src/i18n.tsx`, nav+labels com toggle em Definições). Estender o dicionário a todas as strings para EN total.
- **Real-time**: SSE `/api/events` já refresca dashboard/notificações/atualizações de equipa. Pode-se ampliar (presença, typing, cursor).
- **Virtualização**: infinite-scroll em Enciclopédia + Cartas. Se catálogos crescerem muito, trocar por `@tanstack/react-virtual`.

## ✅ Já feito (não é pendência)
- Autenticação JWT+refresh, equipas/convites, missões server-authoritative, IA multi-provider, chat SSE, tutor RAG (pós-seed), protocolo SRS, gamificação, PWA/offline+sync, guias (HTML standalone + pesquisa), cursos estruturados (16 belts/114 missões), emails (SMTP+templates), CSP/compression/rate-limit, auditoria+log, E2E, docker, og.png, infinite-scroll, real-time, i18n scaffold.

> Regra: nada de chaves no repo. Rotação de tokens recomendada.
