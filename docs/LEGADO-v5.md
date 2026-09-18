# 🧠 PHC Trainer Pro — Formação Profissional · Gestão Cegid PHC Evolution

> Plataforma web (PWA) de **formação prática** para dominar o módulo **Gestão do Cegid PHC Evolution / PHC CS Desktop**: 57 missões passo-a-passo num PHC real, **tutor de IA** que explica cada parágrafo em linguagem simples aplicado à sua **empresa de treino** (12 segmentos de negócio portugueses realistas), flashcards com repetição espaçada, testes por nível e portfólio de evidências.

**🌐 Produção:** https://brunoacidados.github.io/phc-trainer-pro/

Material educativo **não oficial**, baseado em fontes públicas da Cegid PHC (Help Center, programa oficial de certificação, documentação de parceiros). _Cegid PHC® é marca dos respetivos proprietários — projeto sem afiliação._

---

## ✨ Funcionalidades

| Recurso                                 | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧭 **Jornada guiada (v4.0)**            | Liberação progressiva: cada missão concluída libera a seguinte; níveis abrem com 50% do anterior. Página inicial mostra apenas o essencial: missão atual, revisões do dia e meta diária (5 ações). **Modo Foco**: missão em wizard passo-a-passo (🔊 ouvir, 🧠 explicar com IA, ✅ feito) → evidências → perguntas. Modo livre opcional em ⚙️                                                                                                                                                     |
| 🎯 **90 missões práticas (L00–L89)**    | Passos exatos num PHC instalado: infraestrutura, ficheiros, vendas, compras/stocks, financeiro, fiscal, análises, desenvolvimento (Xbase/C#), projeto final + **4 packs de especialização: Contabilidade (L57–L66), Pessoal/Vencimentos (L67–L74), POS & Retalho (L75–L82) e Suporte/Pós-venda (L83–L89)** — tudo com a mesma empresa de treino                                                                                                                                                   |
| 🏢 **Empresa de treino personalizável** | 12 segmentos portugueses realistas (hotelaria, eletrónica, restauração, distribuição, construção, clínica, consultoria IT, indústria, oficina, agricultura, e-commerce, transportes) — cada um com empresa fictícia completa: nome, **NIF com dígito de controlo válido**, CAE, morada, artigos com preços e necessidades reais do negócio. Os textos das missões e da IA **adaptam-se automaticamente** à empresa escolhida                                                                      |
| 🎓 **Curso personalizado por IA**       | Entrevista de 3 passos (segmento → empresa → objetivos/interesses/tempo) gera destaques e ordem das missões; alternativa offline: plano padrão calibrado por segmento                                                                                                                                                                                                                                                                                                                             |
| 📖 **Conceito antes da prática**        | Cada missão abre com teoria em **carrossel interativo**: o que é, conceitos-chave (1 cartão por conceito) e erros comuns                                                                                                                                                                                                                                                                                                                                                                          |
| 🎓 **Aula Guiada**                      | O Professor (tutor IA com voz TTS pt-BR) explica **parágrafo a parágrafo**, em linguagem acessível, aplicado à sua empresa — com avanço automático e cache local                                                                                                                                                                                                                                                                                                                                  |
| 🧠 **Tutor IA (chat)**                  | Perguntas livres sobre PHC Gestão com contexto automático da missão em curso (OpenRouter)                                                                                                                                                                                                                                                                                                                                                                                                         |
| 🎭 **Mascote interativo**               | Professor Einstein 2D (SVG animado): pisca, fala (TTS), "pensa" durante chamadas de IA e dá dicas contextuais por aba                                                                                                                                                                                                                                                                                                                                                                             |
| 🔄 **Circuitos interativos**            | 10 grandes fluxos em carrossel (56 passos): vendas, compras, séries de documentos, transporte/AT, SAF-T, conta corrente, tesouraria, integração contabilística, personalização e fecho do mês — com narração e explicação da IA                                                                                                                                                                                                                                                                   |
| 📕 **Enciclopédia PHC destilada**       | Nova aba com o conhecimento da Enciclopédia PHC oficial (3.966 tópicos): **154 funções internas**, **77 funções Xbase/VFP**, 87 dicas + 18 erros comuns, 220 tópicos de programação, 320 artigos técnicos e o **índice completo do manual (3.076 tópicos / 65 secções)** — com pesquisa global, leitura em voz alta e "🧠 Perguntar ao Professor" por entrada. O tutor de IA **cita a Enciclopédia** nas aulas/chat (mini-RAG por palavras-chave) e as missões têm chips 📕 de referência cruzada |
| 📖 **Dicionário (94 termos)**           | ATCUD, SAF-T, e-Fatura, CIUS-PT, PCMP, CEVMC, aging, reverse charge… com busca, filtros por tema, detalhe prático, voz e aprofundamento do Professor                                                                                                                                                                                                                                                                                                                                              |
| 🗂 **139 flashcards (SRS)**              | Repetição espaçada 1→2→4→7→14→30→60 dias; também em `assets/flashcards-phc.csv` (Anki)                                                                                                                                                                                                                                                                                                                                                                                                            |
| 📝 **13 testes de nível**               | 78 perguntas com explicação; aprovação ≥ 80%                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 🌍 **Contexto país + gama**             | Seletor PT/ES/AO/MZ/CV/PE com ficha de obrigações fiscais e particularidades do software (SII/TicketBAI, AGT/SAF-T AO, retenções PE…); gama Corporate/Advanced/Enterprise com **avisos de requisitos em cada missão**                                                                                                                                                                                                                                                                             |
| 👥 **Progresso de equipa**              | Cada técnico exporta a sua ficha (JSON); o formador importa e compara a equipa numa tabela (com export CSV) — para parceiros que formam vários técnicos                                                                                                                                                                                                                                                                                                                                           |
| 📸 **Portfólio de evidências**          | "Sem evidência, não aconteceu": registo de provas por missão, exportável em CSV                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 🏅 **24 conquistas**                    | Marcos profissionais desbloqueáveis (constância, exames, portefólio e as 4 especializações: Contabilidade, Pessoal, Retalho, Pós-venda) com data de obtenção                                                                                                                                                                                                                                                                                                                                      |
| 📚 **Teoria completa embutida**         | Guia do expert (15 capítulos) no app, com Aula Guiada por capítulo                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 📱 **PWA**                              | Instalável e **offline** após a 1ª visita (service worker)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 💾 **Sem backend**                      | Progresso em `localStorage` + Exportar/Importar JSON                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## 🤖 Tutor IA — Auto-Router multi-fornecedor (v5.0)

- **Nunca mais fique sem créditos:** as chamadas de IA passam por uma cadeia de fornecedores (⚡ Groq → 🇧🇷 Gemini → 🌪 Mistral → 🧠 Cerebras → 🟢 NVIDIA NIM → 🔀 OpenRouter). Falhou (402/429/403/rede)? O router **põe o fornecedor em pausa (cooldown) e tenta o seguinte automaticamente** — com o mesmo prompt/persona, mantendo a linha de raciocínio.
- **Ordem configurável** (↑↓) em ⚙️ Definições + botão "Testar todos os fornecedores" (estado/latência de cada um).
- **Voz é sempre Gemini TTS** (feminina pt-BR, com cache); os restantes fornecedores servem texto/chat/aulas.
- **Gerador de Código PHC** (📚 Aprender → 🧰 Gerador): descreva o problema → recebe "onde configurar + código Xbase/C#/SQL pronto a colar + como testar + cuidados", com as **funções da Enciclopédia injetadas no prompt** (nada de funções inventadas) e preferência por modelos de código (Codestral/NVIDIA).
- Chaves: coladas em ⚙️ Definições (ficam só no navegador) ou por link pessoal `…/#aik=…&gmk=…&grk=…&mst=…&cbs=…&nvi=…` — **nenhuma chave vai para o repositório**.

### Fornecedores testados (set/2026)

| Fornecedor    | Modelo                                  | Estado no teste                                                                                                                                                                  |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⚡ Groq       | openai/gpt-oss-120b                     | ✔ 0.6s, CORS aberto                                                                                                                                                              |
| 🇧🇷 Gemini     | gemini-flash-lite-latest (texto) + TTS  | ✔ 0.8s, CORS ok                                                                                                                                                                  |
| 🌪 Mistral     | mistral-small-latest / codestral-latest | ✔ CORS aberto · ⚠ rate limit ~1 req/s no free (router: retry 1.6s + cooldown 3 min)                                                                                              |
| 🧠 Cerebras   | gpt-oss-120b                            | ✔ CORS aberto · ⚠ 402 (conta exige billing ativado)                                                                                                                              |
| 🟢 NVIDIA NIM | z-ai/glm-5.3                            | ✔ chave válida (7.9s server-side) — mas a API **não envia CORS no preflight**: inutilizável direto do navegador; fica no fim da fila (o router salta-a) ou use via proxy próprio |
| 🔀 OpenRouter | configurável                            | depende de créditos                                                                                                                                                              |

## 🔄 Auto-update (v5.0.1)

O app verifica `version.json` a cada 30 min e no arranque: se houver versão nova, mostra o banner **"🔄 Atualizar agora"** (desregistra o service worker, limpa caches e recarrega). Chega de ficar preso em versão antiga do PWA.

## 📐 SQL correto por construção (v5.2.0)

Gerar SQL para PHC sem conhecer o esquema é receita para campos inventados. A v5.2.0 resolve em três camadas:

1. **Esquema PHC documentado (KB embutida)** — colhido dos exemplos SQL das 4.004 páginas da Enciclopédia oficial: **57 tabelas** com campos reais (`ft.fdata/ndoc/nmdoc`, `cl.nome/ncont/esaldo`, `st.epcpond` (PCMP), `bi.bostamp`…), relações por stamp e a convenção `u_*` dos campos de utilizador. Tudo com proveniência; nada inventado.
2. **"O meu esquema" (por instalação)** — como cada empresa tem campos personalizados, o Gerador inclui um **script de descoberta** (information_schema, no dialecto T-SQL, SQL 2014+) para correr no Simulador de SQL do PHC/SSMS; o resultado cola-se na app (fica no navegador) e é injetado em todos os prompts como **autoridade máxima**. Sem esquema colado, a IA marca pressupostos com `-- [confirmar no Dicionário de Dados]` e sugere a descoberta — nunca inventa.
3. **Regras SQL obrigatórias** — as 12 regras do responsável técnico (minúsculas, blocos `##` com comentários em inglês, T-SQL, sem CTEs/window functions desnecessárias, sem refatorar, nunca inventar nomes, compatível SQL Server 2014+, update/delete com where + select de validação, query completa vs alteração cirúrgica) são injetadas em **todo** prompt que envolva SQL (Gerador e chat).

## 🔎 Descoberta guiada + confiança real (v5.3.0)

O Gerador passou a trabalhar em **modo rigoroso** — como um técnico cuidadoso trabalharia:

1. **Descreve só o problema** ("quero ver os últimos 10 registos na ft e as tabelas relacionadas"). A app deteta automaticamente as tabelas mencionadas.
2. **A IA avalia o que sabe vs. o que não sabe**: responde com uma **fila pendente de validação** e uma **confiança real (0–100 %)**, declarada num bloco de metadados obrigatório (`===META===`) e descontada por cada tabela/campo/relação não confirmada. Abaixo de 99 % não há código final "à sorte".
3. **Script de descoberta sob medida** para as tabelas do pedido: a tabela interna **`dic`** (dicionário de dados do PHC — primeiro a estrutura, depois o conteúdo), colunas via `information_schema`, campos de utilizador **`u_*`**, FKs declaradas, **1 linha de amostra por tabela**, **stored procedures, views e jobs do SQL Agent**. É só correr no Simulador de SQL/SSMS e colar o resultado na app.
4. **Ciclo de resultados**: cada colagem reavalia a fila de pendentes e atualiza a confiança; quando atinge **≥99 %**, a IA entrega o código final completo (📋 onde configurar · código · 🧪 como testar · ⚠ cuidados). Cada colagem fica **acumulada em "📐 O meu esquema"** — a app aprende a BD real e os pedidos seguintes já arrancam com confiança mais alta.
5. **GLM prioritário para código**: os artefatos de código usam preferencialmente `z-ai/glm-5.3` via proxy Cloudflare (o melhor nos testes), depois Codestral M2 e só então o router de velocidade.

## 🌐 Proxy Cloudflare (opcional — ativa a NVIDIA no navegador)

A API da NVIDIA NIM não envia CORS, logo o navegador não a chama diretamente. O repositório inclui um **Worker mínimo e auditável** ([`worker/phc-ai-proxy.js`](worker/phc-ai-proxy.js)) que:

- guarda as chaves em **Secrets do Worker** (nunca no código/app),
- injeta **CORS** com allowlist de origens (por padrão só este site),
- aplica rate limit (~40 req/min/IP),
- expõe `/ping` para o botão "Testar" do app.

**O app já traz um proxy público do projeto pré-configurado** (`https://phc-ai-proxy.brunoacidados.workers.dev`, allowlist: apenas este site) — a NVIDIA funciona sem qualquer configuração. Prefere o seu próprio? **Deploy em 5 min (grátis):** dash.cloudflare.com → Workers & Pages → Create Worker → colar `worker/phc-ai-proxy.js` → Deploy → Settings → Variables and Secrets → Secret `NVIDIA_KEY`. Depois cole o URL do Worker em ⚙️ Definições → 🌐 Proxy (ou abra `…/#pxy=URL_DO_WORKER`). Com o proxy ativo, a **NVIDIA (glm-5.3) sobe para 3.º** na fila do auto-router. Guia completo: [`worker/README.md`](worker/README.md).

## 🤖 Detalhes do tutor

- Aulas guiadas e chat usam a API do [OpenRouter](https://openrouter.ai) (modelo padrão `openai/gpt-4o-mini`). Explicações ficam em **cache no navegador** — cada parágrafo só consome créditos uma vez.
- **Modo econômico** (⚙️ Definições): desliga a IA; a aula passa a ler o texto original em voz alta.
- 🔑 **Chave:** nenhuma chave vem no código (repositório público). Cada utilizador cola a sua em **⚙️ Definições** (fica só no `localStorage`) **ou** abre uma vez um link pessoal `…/#aik=SUA_CHAVE` (o fragmento nunca chega ao servidor). Recomenda-se **limite de créditos** no painel OpenRouter.
- **Voz (4 provedores):**
  - 🇧🇷 **Gemini TTS (RECOMENDADO)** — vozes neurais do Google em **português do Brasil natural e humano** (30 vozes; femininas: Sulafat ⭐, Kore, Leda, Aoede…), modelos 2.5/3.1 flash e pro; chave grátis no AI Studio; **cache de áudio em IndexedDB** (o mesmo texto nunca gera custo 2×); ativação por link `…/#gmk=CHAVE`;
  - 🖥 **Navegador** (grátis/offline) com seleção inteligente — no **Microsoft Edge** as vozes "Online (Natural)" são neurais;
  - 🎙 **ElevenLabs** (neural pt-BR premium, chave própria, cache local);
  - ⚡ **Groq Orpheus** (experimental — docs oficiais: só inglês/árabe).
  - Fallback automático cloud→navegador + boas-vindas pré-gravadas (voz feminina pt-BR).

## 🚀 Executar localmente

Sem build (React 18 + Ant Design 5 via CDN; JSX transpilado no navegador):

```bash
git clone https://github.com/brunoacidados/phc-trainer-pro.git
cd phc-trainer-pro
python3 -m http.server 8080   # http://localhost:8080  (ou abra index.html)
```

> Requer internet na 1ª visita (~4 MB de bibliotecas); depois o service worker serve tudo offline.

## 🌐 Publicar (GitHub Pages)

Site 100% estático — a raiz do repositório é o deploy: **Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`**.

## 🗂 Estrutura

```
phc-trainer-pro/
├── index.html               # aplicação completa (React+AntD via CDN; dados, guia e IA embutidos)
├── sw.js                    # service worker (offline-first)
├── manifest.webmanifest     # PWA
├── icons/                   # ícones 192/512/maskable/apple/favicon
├── assets/
│   ├── img/hero-pro.jpg         # ilustração corporativa (arte original)
│   ├── img/einstein-pro.jpg     # Professor Einstein (arte original)
│   ├── audio/bemvindo.mp3       # mensagem de boas-vindas
│   └── flashcards-phc.csv       # baralho para Anki
├── docs/guia-expert-phc-gestao-evolution.md   # teoria completa (15 capítulos)
├── README.md · LEIA-ME.md · LICENSE (MIT) · .gitignore
```

## 🧭 Método de formação

1. **📜 Protocolo** — regras do treino (regra 0: conceito antes da prática).
2. **🏢 Empresa** — escolha o segmento (ou faça a entrevista de IA) e defina a sua empresa de treino.
3. Missões **L00–L05** — ambiente: SQL Server, instalação PHC, backups, acessos, Dicionário de Dados.
4. Em cada missão: **📖 Conceito** (carrossel) → **🎓 Aula guiada** (opcional) → passos no PHC → **📸 evidências** → ✅ Registar repetição (revisões em 1, 2, 4, 7, 14, 30, 60 dias).
5. A partir da 3ª repetição, **cronometre** (meta por missão). Dominou? **🧠 Sei de cor**.
6. O nível avança com todas as missões 🧠 + teste ≥ 80%.

## 🛣 Roadmap

- [x] Packs de missões: **Contabilidade** (L57–L66) e **Pessoal/Vencimentos** (L67–L74) ✔ v3.2
- [x] **Conquistas** profissionais (22 marcos) ✔ v3.2
- [x] Pack POS/Retalho (L75–L82) e Suporte/Pós-venda (L83–L89) ✔ v3.3
- [x] Contexto por país (PT/ES/AO/MZ/CV/PE) e por gama com avisos de requisitos ✔ v3.3
- [x] Progresso de equipa (fichas exportáveis + painel comparativo) ✔ v3.3

## 📄 Licença

[MIT](LICENSE) — use, adapte e partilhe. Sem evidência, não há aprendizado.

## 📕 Sobre a Enciclopédia PHC (atribuição)

A aba Enciclopédia contém um **índice destilado** da Enciclopédia PHC oficial (CHM, 3.966 tópicos): nomes de funções/tópicos (factuais) e **descrições resumidas e reescritas** (1 frase por entrada), organizadas para estudo. O material original pertence à **Cegid/PHC Software** — todos os direitos reservados. Para o texto integral, use o CHM oficial ou o Help Center in-app do software. Nenhum conteúdo original completo é redistribuído neste projeto.
