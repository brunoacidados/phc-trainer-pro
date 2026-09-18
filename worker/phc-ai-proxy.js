/* ============================================================
   PHC Trainer Pro — Proxy de IA (Cloudflare Worker)
   ------------------------------------------------------------
   • Guarda as chaves de API NO SERVIDOR (Secrets do Worker) —
     nunca no repositório nem no navegador.
   • Adiciona CORS para APIs que não o suportam no browser
     (ex.: NVIDIA NIM / integrate.api.nvidia.com).
   • Restringe origens (por padrão, só o site GitHub Pages) e
     limita ~40 pedidos/min por IP.
   Deploy e configuração: ver worker/README.md
   ============================================================ */

const UPSTREAMS = {
  nvidia: {
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    keyVar: "NVIDIA_KEY",
  },
  // Extensível: adicione aqui outros fornecedores que precisem de proxy
  // ex.: meuprovider: { url: "https://api.x.com/v1/chat/completions", keyVar: "X_KEY" }
};

const DEFAULT_ORIGINS = ["https://brunoacidados.github.io"];
const RATE_MAX_PER_MIN = 40;
const hits = new Map();

function allowedOrigins(env) {
  if (env && env.ALLOWED_ORIGINS) {
    return String(env.ALLOWED_ORIGINS)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_ORIGINS;
}

function corsFor(origin, env) {
  const allow = allowedOrigins(env);
  const ok = allow.includes("*") || allow.includes(origin);
  return {
    ok,
    headers: {
      "Access-Control-Allow-Origin": ok ? origin || "*" : "",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  };
}

function rateLimited(ip) {
  const minute = Math.floor(Date.now() / 60000);
  const k = ip + ":" + minute;
  const n = (hits.get(k) || 0) + 1;
  hits.set(k, n);
  if (hits.size > 5000) hits.clear(); // higiene de memória do isolate
  return n > RATE_MAX_PER_MIN;
}

function json(obj, status, corsHeaders, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json" }, corsHeaders, extraHeaders || {}),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsFor(origin, env);

    if (!cors.ok) {
      return json(
        { error: "Origem não permitida: " + (origin || "(sem Origin)") },
        403,
        cors.headers,
      );
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors.headers });
    }

    // Health-check / descoberta (usado pelo botão "Testar" do app)
    if (url.pathname === "/ping" || url.pathname === "/health") {
      const providers = Object.keys(UPSTREAMS).filter((p) => env && env[UPSTREAMS[p].keyVar]);
      return json({ ok: true, service: "phc-ai-proxy", version: 1, providers }, 200, cors.headers);
    }

    if (request.method !== "POST") {
      return json({ error: "Use POST (ou GET /ping)" }, 405, cors.headers);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "desconhecido";
    if (rateLimited(ip)) {
      return json(
        { error: "Rate limit do proxy excedido (" + RATE_MAX_PER_MIN + "/min)" },
        429,
        cors.headers,
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: "JSON inválido no corpo do pedido" }, 400, cors.headers);
    }

    const provider = body.provider || "nvidia";
    const up = UPSTREAMS[provider];
    if (!up) return json({ error: "Fornecedor desconhecido: " + provider }, 400, cors.headers);

    const key = env && env[up.keyVar];
    if (!key)
      return json(
        { error: "Segredo " + up.keyVar + " não configurado no Worker" },
        500,
        cors.headers,
      );

    const payload = Object.assign({}, body);
    delete payload.provider;

    try {
      const r = await fetch(up.url, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      return new Response(text, {
        status: r.status,
        headers: Object.assign({}, cors.headers, {
          "Content-Type": r.headers.get("Content-Type") || "application/json",
        }),
      });
    } catch (e) {
      return json(
        { error: "Falha no upstream: " + String((e && e.message) || e) },
        502,
        cors.headers,
      );
    }
  },
};
