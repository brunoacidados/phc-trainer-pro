# 🔎 Auditoria do projeto — PHC Trainer Pro (v6.9.0)

Estado: monorepo pnpm (api Express5+Mongoose9 · web React19+Vite8+Tailwind4 · packages content/shared).
CI: job `quality` (lint+typecheck+test+build) + job `e2e` (Playwright c/ Chromium + Mongo em memória).
Deploy: API Render · web Vercel · legado v5 ainda na raiz (GitHub Pages) com banner de migração **ativo**.

---

## A. O que FALTA (depende do dono do projeto — não é código)

| #   | Item                                        | Onde / como                                                                                          |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **Seed do RAG** (chunks=0 → RAG inativo)    | `MONGODB_URI=… GEMINI_API_KEY=… pnpm --filter @phc/api rag:seed`                                     |
| 2   | **Email a enviar p/ qualquer destinatário** | Render: Gmail SMTP (app-password) **ou** Resend c/ domínio verificado + `APP_URL` (ver DEPLOY §5b-2) |
| 3   | **Imagens realistas (PNG)**                 | gerar c/ `docs/PROMPTS-IMAGENS.md` → `apps/web/public/img/guia/lvlN.png` (SVG é fallback atual)      |
| 4   | **Piloto com a equipa**                     | criar equipa, convidar 2–3 técnicos, validar fluxo                                                   |
| 5   | **Corte final do legado**                   | após piloto: remover raiz v5 / desligar Pages (banner já ativo)                                      |
| 6   | **Rodar token GitHub** exposto no chat      | github.com → Settings → Tokens                                                                       |

## B. Lacunas / melhorias de CÓDIGO (priorizadas)

### 🔴 Alta

| #   | Melhoria                                                                                 | Porque                                          |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| B1  | **CSP (Content-Security-Policy)** na web (vercel.json)                                   | tenhoX-Frame/Referrer/Permissions mas falta CSP |
| B2  | **Índice DB em `chathistories.userId`**                                                  | consulta por utilizador sem índice              |
| B3  | **Compressão (gzip/brotli) na API** (`express` compression)                              | payloads JSON grandes (progress, dashboard)     |
| B4  | **Remover código morto**: `apps/web/src/lib/levelImages.ts` (substituído por LevelImage) | limpeza                                         |
| B5  | **Usar ou remover `welcomeEmailHtml`** (template criado mas nunca enviado)               | enviar boas-vindas após verificação, ou remover |

### 🟠 Média

| #   | Melhoria                                                                       | Porque                        |
| --- | ------------------------------------------------------------------------------ | ----------------------------- |
| B6  | **E2E mais largo**: fluxos AI (c/ keys mock), atribuições, notificações, admin | só 2 specs de fumo hoje       |
| B7  | **Pesquisa full-text no guia** (realçar ocorrências, não só filtrar índice)    | pedido natural p/ página HTML |
| B8  | **Rate-limit próprio em rotas admin** (mais estrito que o global 300/min)      | proteção extra                |
| B9  | **Audit-log de ações de admin** (quem apagou/desativou/quê)                    | rastreabilidade em equipa     |
| B10 | **Paginação em `/api/admin/users`** (hoje limit 500)                           | escala                        |
| B11 | **docker-compose local** (mongo+api+web) p/ dev em 1 comando                   | DX                            |
| B12 | **Testes unitários p/ email service/templates**                                | cobertura                     |

### 🟡 Baixa / polish

| #   | Melhoria                                                                          | Porque          |
| --- | --------------------------------------------------------------------------------- | --------------- |
| B13 | **a11y**: aria-labels em todos os icon-buttons; contraste do tema claro auditado  | WCAG            |
| B14 | **Real-time** (SSE/WebSocket) p/ dashboard/notificações em vez de polling 60/120s | vivacidade      |
| B15 | **i18n** (PT→ES/EN) se a equipa crescer p/ outros países                          | alcance         |
| B16 | **Virtualizar listas longas** (Enciclopédia 3.9k, DeckBrowser) se houver lag      | perf            |
| B17 | **Força de password** (zxcvbn) no registo/reset                                   | segurança conta |
| B18 | **og.png** dedicado p/ partilha social (prompt já existe)                         | marketing       |
| B19 | **Health-check com latência** (mongo ping ms) no /api/health                      | ops             |
| B20 | **Script de seed de dados demo** (equipa+progresso fictício) p/ demos             | vendas/demo     |

## C. O que está SÓLIDO (não mexer sem razão)

- Arquitetura monorepo + contratos Zod partilhados · SRS/conquistas autoritativos no servidor ·
  router IA c/ backoff+circuit-breaker+fallback Bynara · RAG c/ fallback gracioso · PWA offline ·
  templates de email · página HTML autónoma do guia · admin c/ recuperação manual · CI completo.

## D. Riscos conhecidos

- **Bundle inicial** ~130KB gzip + chunk de conteúdo ~253KB gzip (lazy) — aceitável; vigiar.
- **Legacy duplicado** na raiz até ao corte — intencional (banner ativo), remover no corte.
- **Chave Bynara em código** — aprovada pelo dono (roda diariamente); aceitável p/ fallback.
- **Resend default from** só envia p/ o dono — mitigado c/ SMTP Gmail; documentado.

---

## ✅ Estado da aplicação das melhorias (v6.10.0)

- **Lote1 (B1,B2,B3,B4,B8,B10,B11,B12,B19):** ✅ aplicado (CSP, índice, compressão, limpeza, rate-limit admin, paginação, docker-compose, testes email, health latency).
- **Lote2 (B5,B9,B13,B17):** ✅ aplicado (welcome-email, audit-log+UI, aria-labels, força de password).
- **Lote3 (B6,B7):** ✅ aplicado (E2E UX extra, full-text no guia).
- **Curso por módulos:** ✅ página 🎓 Cursos + **1º módulo planeado autorado: CRM & Marketing** (nível 13, L90–L97 + teoria + 12 cartas + teste).
- **Diferidos (conscientes):** B14 real-time SSE, B15 i18n, B16 virtualização, B18 og.png (prompt pronto).

## ✅ Conteúdo — upgrade de fidelidade: Contabilidade (v6.14.0)

Curso de Contabilidade (nível 9, L57–L66) re-alinhado às **fontes oficiais PHC/Cegid** (programa da Certificação PHC CS Contabilidade, aulas e-learning oficiais, Help Center, ficha do produto e canal YouTube Cegid PHC):

- **Recursos oficiais por missão** — novo campo `links` em `Lab` (tipos manual/vídeo/doc/canal): 41 ligações verificadas distribuídas por L57–L66 (15 artigos do Help Center, 4 PDFs oficiais, 13 vídeos do canal @SoftwarePHC/Cegid Portugal & África, incl. a série "Contabilidade Inteligente para Contabilistas do Futuro" Ep.1–5). Renderizados como chips clicáveis na página da missão.
- **Painel "Programa oficial PHC"** na página 🎓 Cursos: 7 temas da certificação, as 20 aulas e-learning oficiais (com durações) + 3 do bloco Enterprise + circuito do Imobilizado, cada aula mapeada à missão correspondente; âmbito oficial do produto (13 itens da ficha PHC); PEP/Cegid Academy.
- **Teoria enriquecida** (L57–L66) com conceitos oficiais: geral×analítica, BD Pronta, integração online×lote, documentos pré-definidos na Gestão, regime especial de caixa (DL 71/2013), inversão do sujeito passivo, suporte XML da Declaração Periódica, Modelo 30, Modelo 22 (PPC/PEC), IES/DA, ABDR, DFC, Plano de Contas Paralelo, Naturezas e Dimensões, 17 meses, grelha de transição, movimentos do ano anterior, SAF-T (PT) da Contabilidade, selo SVAT, reavaliação×revalorização.
- **25 flashcards novos de nível 9** (o nível não tinha cartas): 163 → 188; CSV p/ Anki regenerado.
- **Teste de nível 9: 6 → 14 perguntas** (taxonomia, SAF-T contabilidade, SVAT, regime de caixa, inversão, 17 meses, plano paralelo, PPC/PEC).
- **Vídeos oficiais nos Recursos** (📚 Aprender → 📥 Recursos) + contagem de cartas dinâmica.
- **Novos testes de integridade** (`content.test.ts`, 9 casos): missões/cartas/testes válidos, links bem formados, programa oficial completo (20+3 aulas → missões existentes), vídeos só YouTube, Help Center só domínios oficiais.
- Fontes: `packages/content/src/data/contab-oficial.json` (nova) — certificação, aulas, âmbito, manuais, vídeos, canais, PEP.

## ✅ Plano recomendado (próximas iterações)

1. **Quick wins (B1–B5)** — CSP, índice, compressão, limpeza, welcome email. (rápido, alto valor)
2. **Robustez (B6–B12)** — E2E largo, full-text guia, rate-limit admin, audit-log, paginação, docker-compose, testes email.
3. **Polish (B13–B20)** — a11y, real-time, i18n, virtualização, zxcvbn, og.png, health latency, seed demo.
4. **Operação** — seed RAG + email SMTP + imagens PNG + piloto + corte (lado do dono).
