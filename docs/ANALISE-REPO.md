# 📋 Análise do Repositório — PHC Trainer Pro (v5.3.0)

> Gerada em 2026-09-18 · branch `main` · working tree limpo · 23 commits (15–16/set/2026, desenvolvimento intensivo v3.2 → v5.3.0)

## 1. O que é o projeto

**PWA de formação prática** para dominar o módulo **Gestão do Cegid PHC Evolution / PHC CS Desktop**. 100% estático, sem build, sem backend — progresso em `localStorage`. Produção: https://brunoacidados.github.io/phc-trainer-pro/ (GitHub Pages, raiz do repo).

**Stack:** React 18.3 + Ant Design 5.21 via CDN · JSX transpilado **no navegador** (Babel standalone 7.25.6) · service worker offline-first (cache `phc-trainer-v14`) · PWA instalável.

## 2. Estrutura de ficheiros (20 no total)

| Ficheiro                                   | Papel                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `index.html` (**900 KB, 2.777 linhas**)    | A aplicação inteira: CSS + dados embutidos + app React                                           |
| `sw.js`                                    | Service worker: cache v14, offline-first, IA sempre via rede, `version.json` sem cache           |
| `manifest.webmanifest`                     | PWA (pt-BR, tema #f5a623, standalone)                                                            |
| `version.json`                             | `v5.3.0` — usado pelo auto-update (poll a cada 30 min)                                           |
| `worker/phc-ai-proxy.js`                   | Cloudflare Worker: proxy CORS p/ NVIDIA NIM + secrets + rate limit 40/min + allowlist de origens |
| `worker/README.md`                         | Deploy em 5 min; instância pública: `phc-ai-proxy.brunoacidados.workers.dev`                     |
| `docs/guia-expert-phc-gestao-evolution.md` | Teoria completa (15 capítulos, 815 linhas) — também embutida como `GUIA_HTML`                    |
| `assets/`                                  | hero + Einstein (jpg), bemvindo.mp3, flashcards-phc.csv (Anki)                                   |
| `icons/`                                   | 192/512/maskable/apple/favicon                                                                   |
| `README.md` + `LEIA-ME.md`                 | Documentação técnica + guia do utilizador                                                        |

## 3. Anatomia do index.html

### Bloco A — Dados (linhas 153–420, JS puro, ~695 KB) ✔ `node --check` OK

| Variável               | Conteúdo                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BELTS`                | 13 níveis: Fundamentos → Ficheiros → Vendas → Compras&Stocks → Financeiro → Fiscal → Análises → Desenvolvimento → Projetos → Contabilidade → RH → POS&Retalho → Suporte |
| `DATA`                 | **90 missões L00–L89** (passos, provas, perguntas, refs), **139 flashcards**, **13 quizzes (78 perguntas)**, `theory` por missão (carrossel conceito/erros comuns)      |
| `SEGMENTOS`            | 12 empresas de treino portuguesas (NIF com dígito de controlo válido, CAE, artigos)                                                                                     |
| `GLOSSARIO`            | 94 termos (ATCUD, SAF-T, CIUS-PT…)                                                                                                                                      |
| `ENC`                  | Enciclopédia destilada: 154 funções internas, 77 Xbase/VFP, 87 dicas, 18 erros, 220 tópicos prog., 70 artigos, índice do manual (65 secções)                            |
| `SCHEMA`               | Esquema BD documentado: 11 tabelas core (ft, cl, st, bi…) + `harvest` com campos reais + convenções (ref/stamp/nolock, `u_*`)                                           |
| `SQL_RULES`            | As 12 regras SQL obrigatórias do responsável técnico                                                                                                                    |
| `DISCOVERY_SQL`        | Script de descoberta padrão (T-SQL)                                                                                                                                     |
| `GUIA_HTML`/`GUIA_TOC` | Guia 15 capítulos (~257 KB)                                                                                                                                             |

### Bloco B — App React (linhas 422–2768, JSX) ✔ transpila sem erros (Babel 7.25.6)

**Estado:** `S` global em `localStorage["phcTrainerPro.v3"]` + `useSyncExternalStore` + `renderTick()` manual (store caseiro, sem Redux). Migração automática de chaves legadas (v1/v2, base64).

**UI — 7 abas:** 🎯 Jornada (hoje: missão atual + revisões + meta 5 ações) · 🗺️ Missões (trilha com liberação progressiva) · 📚 Aprender (Circuitos + Dicionário + Guia + Protocolo + **🧰 Gerador**) · 📕 Enciclopédia · 🧠 Praticar (Cartas SRS + Testes) · 📊 Progresso (Visão + Provas + Conquistas + Equipa) · 🏢 Empresa (segmento + país PT/ES/AO/MZ/CV/PE + gama).

**Componentes-chave:** `Mascot` (Einstein SVG animado, bus de mood/bubble) · `LessonDrawer` (aula guiada parágrafo a parágrafo) · `ChatDrawer` (tutor IA com contexto da missão) · `FocusModal` (Modo Foco: wizard passo a passo) · `OnboardModal`/`OnboardTour` · `SettingsDrawer` + `AiProviders` + `VoiceSettings`.

**Mecânicas pedagógicas:** SRS ladder `1→2→4→7→14→30→60` dias · XP/streak/conquistas (24) · níveis abrem com 50% do anterior · evidências ("sem evidência, não aconteceu") · progresso de equipa (JSON export/import + CSV).

### Subsistema IA (v5.0 → v5.3)

1. **Auto-router** (`AI_PROVIDERS`, `openAI()`): Groq → Gemini → Mistral → Cerebras → NVIDIA → OpenRouter. Cooldown por status (402/401/403 = 3h; 429 = 3min; rede = 90s), retry 429 com 1.6s, último fornecedor bom vai p/ frente, ordem configurável (↑↓), `code:true` prefere NVIDIA/Mistral (Codestral).
2. **Proxy Cloudflare**: `hasProxy()` → NVIDIA sobe p/ 3º (`autoOrder()`); Worker injeta `NVIDIA_KEY` (secret) e devolve CORS; `/ping` para o botão Testar.
3. **Voz (v4.1)**: 4 provedores (Gemini TTS ⭐ feminino pt-BR com cache IndexedDB, navegador, ElevenLabs, Groq Orpheus) + fallback automático + mp3 de boas-vindas.
4. **Mini-RAG**: `encContext()` (palavras-chave → entradas da Enciclopédia) e `schemaContext()` (KB + "O meu esquema" do utilizador como AUTORIDADE MÁXIMA) injetados em todos os prompts.
5. **Gerador (v5.2–5.3) — descoberta guiada**: `GEN_CONTRACT` (FASE 1 pendentes / FASE 2 código final), bloco `===META===` (confiança 0–100, pendentes, estado, tabelas) parseado por `parseMeta()`, `buildDiscovery()` gera script sob medida (dic → information_schema → u_* → FKs → amostras → storeds/views/jobs), `genContinue()` acumula resultados em `S.dbSchema` (máx. 24 KB) até confiança ≥99%.
6. **Auto-update (v5.0.1)**: `checkUpdate()` compara `version.json` com `APP_VERSION` (ambos 5.3.0 ✔) → banner → desregistra SW + limpa caches + reload.
7. **Chaves por URL** (fragmento nunca vai ao servidor): `#aik= #gmk= #grk= #mst= #cbs= #nvi= #elk= #pxy=` — limpa o hash após guardar.

## 4. Estado de saúde

| Verificação                                                 | Resultado                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| Sintaxe bloco dados (node --check)                          | ✅ OK                                                      |
| Transpilação JSX (Babel 7.25.6, mesmo preset do runtime)    | ✅ OK                                                      |
| Versões sincronizadas (version.json = APP_VERSION = footer) | ✅ 5.3.0                                                   |
| Git limpo e sincronizado com origin/main                    | ✅                                                         |
| Chaves/segredos no repo                                     | ✅ nenhum (design correto: só no navegador/Worker secrets) |

### Pequenas inconsistências notadas (candidatas a correção)

1. **README/LEIA-ME desatualizados em pontos**: fala em "57 missões" nalguns sítios quando são **90** (L00–L89); `manifest.webmanifest` description também diz 57.
2. **`assets/flashcards-phc.csv` tem 142 linhas** vs README dizendo 139 cartas no app / LEIA-ME dizendo 126 no CSV — números divergentes.
3. **Roadmap do README** está todo marcado ✔ (sem próximos passos visíveis).
4. `SW` cache version (v14) não é derivado do `version.json` — exige bump manual a cada release (já é o processo).
5. Ficheiro único de 900 KB — funciona, mas dificulta manutenção/diffs (candidato a modularização futura, se desejado).

## 5. Convenções a respeitar ao continuar

- Português **do Brasil** na persona/IA; conteúdo das missões em PT-PT (software).
- Sem build: tudo dentro de `index.html`; dados no bloco A, UI no bloco B.
- Ao lançar versão: bump `version.json` + `APP_VERSION` + footer + `CACHE` no `sw.js` + README/LEIA-ME.
- Commits no estilo: `feat(v5.x.x): descrição curta em pt`.
- Nunca commitar chaves de API.

## ⚠️ Nota de segurança

O token GitHub (`ghp_…`) foi partilhado em texto no chat. **Recomenda-se revogá-lo/rotacioná-lo** em github.com → Settings → Developer settings → Personal access tokens, assim que possível. Ele não foi gravado em nenhum ficheiro persistido do workspace (o `.git/config` local é excluído dos snapshots).
