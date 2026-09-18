# 🌐 phc-ai-proxy — Cloudflare Worker (5 minutos, grátis)

> **Instância pública do projeto:** `https://phc-ai-proxy.brunoacidados.workers.dev` (já pré-configurada no app; allowlist = site do projeto). Instruções abaixo para criar a SUA instância.

Proxy mínimo que **guarda as chaves de API no servidor** e adiciona **CORS** para APIs que o navegador não consegue chamar diretamente (ex.: **NVIDIA NIM**). Criado para o [PHC Trainer Pro](https://brunoacidados.github.io/phc-trainer-pro/).

## Porquê?

A API da NVIDIA (`integrate.api.nvidia.com`) funciona perfeitamente via servidor/curl, mas **não devolve headers CORS** — o navegador bloqueia a chamada direta. Este Worker recebe o pedido do app, injeta a chave (que vive num **Secret** do Worker, nunca no código) e devolve a resposta com CORS.

## Deploy (Dashboard, sem linha de comandos)

1. Crie conta grátis em **https://dash.cloudflare.com** (plano free chega e sobra).
2. Menu **Workers & Pages → Create → Worker** → nome: `phc-ai-proxy` → **Create**.
3. Clique **Edit code** → apague o exemplo → **cole o conteúdo de `phc-ai-proxy.js`** → **Deploy**.
4. No Worker: **Settings → Variables and Secrets → Add**:
   - Type: **Secret** · Name: `NVIDIA_KEY` · Value: `nvapi-...` (a sua chave) → Save.
   - (Opcional) Type: Text · Name: `ALLOWED_ORIGINS` · Value: `https://brunoacidados.github.io` (lista separada por vírgulas; omissão = só este domínio).
5. Copie o URL do Worker: `https://phc-ai-proxy.<o-seu-subdomínio>.workers.dev`.

## Ligar ao app

- No site: **⚙️ Definições → 🌐 Proxy Cloudflare** → cole o URL → **Testar** (deve responder `Proxy OK — providers: nvidia`).
- Com o proxy ativo, a **NVIDIA (glm-5.3) sobe para 3.º na fila** do auto-router (atrás de Groq e Gemini) e o botão "Testar todos" passa a mostrá-la a ✔.
- Alternativa 1-clique: abra `https://brunoacidados.github.io/phc-trainer-pro/#pxy=https://phc-ai-proxy.<subdomínio>.workers.dev`

## Verificação rápida (terminal)

```bash
curl https://phc-ai-proxy.<subdomínio>.workers.dev/ping
# {"ok":true,"service":"phc-ai-proxy","version":1,"providers":["nvidia"]}

curl -X POST https://phc-ai-proxy.<subdomínio>.workers.dev \
  -H 'Content-Type: application/json' -H 'Origin: https://brunoacidados.github.io' \
  -d '{"provider":"nvidia","model":"z-ai/glm-5.3","messages":[{"role":"user","content":"diga OK"}],"max_tokens":64}'
```

## Segurança incluída

- ✅ Chaves só no Worker (Secrets cifrados) — zero chaves no repositório/app
- ✅ **Allowlist de origens** (por padrão só o site do projeto; 403 para as outras)
- ✅ Rate limit ~40 pedidos/min por IP (anti-abuso básico)
- ✅ Sem cache/registro dos conteúdos em trânsito
- ⚠️ Lembrete: o Worker é seu — pode rodar/parar quando quiser; o plano grátis da Cloudflare (100k pedidos/dia) cobre largamente o uso pessoal/-formação

## Estender

O mapa `UPSTREAMS` no topo aceita novos fornecedores (basta adicionar URL + nome do Secret). O corpo do pedido segue o formato OpenAI (`model`, `messages`, `max_tokens`, `temperature`).
