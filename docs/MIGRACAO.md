# 🛣 Migração legado (v5.3 PWA) → v6 (multiutilizador)

## Princípios

1. **Nada se perde:** todo o conteúdo foi extraído mecanicamente do `index.html` legado por
   `scripts/extract-legacy-content.mjs` (19 JSON tipados em `@phc/content` — 90 missões, teoria,
   139 cartas, 13 testes, 12 segmentos, 94 termos, 10 circuitos, 6 países, enciclopédia completa,
   esquema BD, guia 15 capítulos, conquistas, vozes, prompts/persona/regras SQL do Gerador).
2. **O legado continua no ar** (raiz do repo → GitHub Pages) até a v6 cobrir o essencial.
3. **Progresso migra:** cada utilizador importa o seu JSON exportado (Definições → 💾 Importar
   do app legado). As chaves de IA antigas são descartadas — passam a ser da equipa (servidor).

## Estado da migração por funcionalidade

| Funcionalidade legada                                                 | v6              | Notas                                                                     |
| --------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------- |
| Missões L00–L89 + trilha guiada                                       | ✅              | lista + detalhe completos                                                 |
| Conceito/carrossel de teoria                                          | ✅              | secção 📖 no detalhe (carousel→secção simples)                            |
| Passos + provas + perguntas                                           | ✅              | checkboxes sincronizadas com o servidor                                   |
| SRS (reps, escada, "sei de cor", cronómetro)                          | ✅              | autoritativo no servidor                                                  |
| Evidências (portefólio + CSV)                                         | ✅ (CSV falta)  | registo/eliminar feitos; export CSV é trivial de acrescentar              |
| Flashcards + sessão (due/new/mix)                                     | ✅              |                                                                           |
| Testes de nível (≥80%)                                                | ✅              | com explicações                                                           |
| Conquistas (24)                                                       | ✅              | avaliadas no servidor a cada ação                                         |
| XP/streak/meta diária                                                 | ✅              | Jornada                                                                   |
| Empresa de treino (12 segmentos)                                      | ✅              | Definições → 🏢 (nome/cidade custom: campo pronto na API)                 |
| País/gama + avisos por missão                                         | ✅              | GRADE_NOTES no detalhe da missão                                          |
| Dicionário (94)                                                       | ✅              | pesquisa + filtro por tema + 🧠                                           |
| Enciclopédia + pesquisa global                                        | ✅              | encSearchAll partilhado                                                   |
| Guia completo (15 cap.)                                               | ✅              | render HTML + TOC                                                         |
| Circuitos (10 × slides)                                               | ✅              | com voz + explicação IA                                                   |
| Tutor IA (chat livre c/ contexto)                                     | ✅              | "Dúvida rápida" no detalhe; persona injetada no servidor                  |
| Explicações 🧠 com cache                                              | ✅              | cache localStorage por hash                                               |
| Gerador de código (descoberta guiada, META, confiança, "meu esquema") | ✅              | contrato/scripts/parseMeta partilhados no @phc/shared                     |
| Voz TTS (Gemini/EL/Groq/navegador) + cache IDB                        | ✅              | via servidor (base64) + cache IndexedDB + fallback                        |
| Auto-router 6 fornecedores + cooldowns                                | ✅ **servidor** | melhor: sem CORS, chaves cifradas, NVIDIA direta                          |
| Equipa (export/import JSON + tabela)                                  | ✅ **nativo**   | contas + painel do formador em tempo real                                 |
| Import do progresso legado                                            | ✅              | POST /api/meta/import-legacy                                              |
| **Modo Foco (wizard passo-a-passo)**                                  | ⬜              | próxima iteração — componentes prontos, falta o flow modal                |
| **Mascote Einstein (SVG animado, dicas)**                             | ⬜              | o asset existe (assets/img); porta-se como componente flutuante           |
| **Aula guiada parágrafo-a-parágrafo**                                 | ⬜              | LessonDrawer → página/modal com fila de parágrafos + cache                |
| **Onboarding + entrevista de IA (curso personalizado)**               | ⬜              | WIZ legado → wizard RHF; endpoint de plano já passa por /ai/chat          |
| **PWA/offline (service worker, instalável)**                          | ⬜              | decidir: manifest+vite-plugin-pwa com API offline-first (fila de sync)    |
| **Auto-update (version.json)**                                        | ⬜              | deploy contínuo (Vercel) torna-o obsoleto; manter banner de versão se PWA |
| Protocolo (regras do treino)                                          | ⬜              | página estática simples (conteúdo no guia)                                |
| Progresso CSV (evidências)                                            | ⬜              | botão de export                                                           |
| E2E Playwright com browsers                                           | ⬜              | specs de fumo escritos; `playwright install` no CI quando houver deploy   |

## Plano sugerido (iterações)

1. **Iteração atual (feita):** fundação multiutilizador — contas, equipas, progresso no servidor,
   IA no servidor, conteúdo extraído, páginas nucleares, CI.
2. **Iteração 2 (FEITA):** Modo Foco + mascote + aula guiada + chat global + onboarding/entrevista
   - protocolo + CSV → paridade funcional de estudo com o legado.
3. **Iteração 3 (FEITA — infraestrutura):** deploy pronto (render.yaml blueprint, Dockerfile,
   vercel.json c/ headers), E2E no CI, validação HTTP de 39 pontos (`scripts/api-flow-test.mjs`),
   convite por link (`/entrar/CODE`), Sentry api+web, claims sempre frescos (role/equipa por BD).
   **Falta: executar o deploy real + teste piloto** (contas Atlas/Render/Vercel do dono do projeto).
4. **Iteração 4 (FEITA — código):** PWA/offline na v6 (vite-plugin-pwa + fila de sync + indicador
   offline) e **banner de migração embutido no legado** (adormecido; ativa-se editando `migrate.json`
   na raiz — `enabled:true` + URL da v6; sw.js bumped para v15).

5. **Iteração 5 (FEITA):** Command Palette (Ctrl+K) · página Progresso (heatmap+gráficos+
   conquistas+provas) · IA streaming (SSE) · chat persistente · **RAG semântico** (embeddings +
   busca vetorial, seed 1 comando, fallback gracioso).

6. **Corte final (depende do dono do projeto):** checklist completa em **`FAZER-DEPOIS.md`**
   (deploy ✅ → [seed RAG opcional] → piloto → ativar banner → desligar Pages / mover raiz para `legacy/`).

## Como voltar a extrair conteúdo do legado

```bash
node scripts/extract-legacy-content.mjs            # reescreve packages/content/src/data/*.json
pnpm -r typecheck && pnpm -r test                  # valida tipos e regras
```
