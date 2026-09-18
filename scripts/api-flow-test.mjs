/**
 * Validação HTTP do fluxo completo (mesmo guião dos E2E Playwright, sem browser).
 * Uso: node scripts/api-flow-test.mjs  (requer API em http://localhost:4000)
 */
const BASE = process.env.API_URL || "http://localhost:4000";
let passed = 0;
let failed = 0;

function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name} ${extra}`);
  }
}

async function req(method, path, { token, body, rt } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (rt) headers["x-refresh-token"] = rt;
  const r = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await r.json();
  } catch {}
  return { status: r.status, json };
}

const uid = Date.now();
const emailA = `boss.${uid}@test.local`;
const emailB = `newb.${uid}@test.local`;

console.log("1. AUTH");
const reg = await req("POST", "/api/auth/register", {
  body: { name: "Boss HTTP", email: emailA, password: "teste-123" },
});
check(
  "register → 201 + tokens",
  reg.status === 201 && !!reg.json?.accessToken && !!reg.json?.refreshToken,
  JSON.stringify(reg.json).slice(0, 120),
);
const tkA = reg.json.accessToken;
const rtA = reg.json.refreshToken;

const dup = await req("POST", "/api/auth/register", {
  body: { name: "Duplicado", email: emailA, password: "teste-123" },
});
check("e-mail duplicado → 409", dup.status === 409);

const badLogin = await req("POST", "/api/auth/login", {
  body: { email: emailA, password: "errada-123" },
});
check("password errada → 401", badLogin.status === 401);

const me = await req("GET", "/api/auth/me", { token: tkA });
check(
  "me → user + team null",
  me.status === 200 && me.json?.user?.email === emailA && me.json?.team === null,
);

const noAuth = await req("GET", "/api/auth/me");
check("me sem token → 401", noAuth.status === 401);

console.log("2. PROGRESSO + SRS");
const prog0 = await req("GET", "/api/progress", { token: tkA });
check(
  "progress default criado",
  prog0.status === 200 &&
    prog0.json?.state?.v === 3 &&
    prog0.json?.state?.company?.segId === "distrib",
);

const rep1 = await req("POST", "/api/progress/reps", { token: tkA, body: { labId: "L00" } });
const l00 = rep1.json?.state?.labs?.L00;
check(
  "rep L00 → c=1, due=amanhã, conquista 'primeira-pratica'",
  rep1.status === 200 &&
    l00?.c === 1 &&
    l00?.due &&
    rep1.json?.unlocked?.includes("primeira-pratica"),
  JSON.stringify(l00),
);

const repTimed = await req("POST", "/api/progress/reps", {
  token: tkA,
  body: { labId: "L00", timedSec: 1234 },
});
check("rep cronometrada → timed[]", repTimed.json?.state?.labs?.L00?.timed?.includes(1234));

const step = await req("POST", "/api/progress/steps", {
  token: tkA,
  body: { labId: "L00", index: 0 },
});
check("toggle step", step.json?.state?.labs?.L00?.steps?.["0"] === true);

const proof = await req("POST", "/api/progress/proofs", {
  token: tkA,
  body: { labId: "L00", index: 1 },
});
check("toggle proof", proof.json?.state?.labs?.L00?.proofs?.["1"] === true);

const evid = await req("POST", "/api/progress/evid", {
  token: tkA,
  body: { lab: "L00", kind: "print", txt: "print-http.png" },
});
check("evidência registada", evid.json?.state?.evid?.[0]?.txt === "print-http.png");

const card = await req("POST", "/api/progress/cards/rate", { token: tkA, body: { idx: 0, q: 2 } });
check(
  "carta 'sabia' → c=1 + escada",
  card.json?.state?.cards?.["0"]?.c === 1 && !!card.json?.state?.cards?.["0"]?.due,
);

const quiz = await req("POST", "/api/progress/quiz", { token: tkA, body: { lv: 0, pct: 90 } });
check(
  "teste 90% → aprovado",
  quiz.json?.state?.quiz?.["0"]?.passed === true && quiz.json?.state?.quiz?.["0"]?.best === 90,
);

const quiz2 = await req("POST", "/api/progress/quiz", { token: tkA, body: { lv: 0, pct: 40 } });
check("teste 40% depois → passed mantém-se", quiz2.json?.state?.quiz?.["0"]?.passed === true);

const comp = await req("PUT", "/api/progress/company", {
  token: tkA,
  body: { segId: "hotel", nome: "Hotel E2E" },
});
check(
  "empresa → segmento hotel",
  comp.json?.state?.company?.segId === "hotel" && comp.json?.state?.company?.nome === "Hotel E2E",
);

const ctx = await req("PUT", "/api/progress/contexto", {
  token: tkA,
  body: { pais: "ES", gama: "Corporate" },
});
check("contexto ES/Corporate", ctx.json?.state?.contexto?.pais === "ES");

const mastered = await req("POST", "/api/progress/mastered", {
  token: tkA,
  body: { labId: "L00" },
});
check("sei de cor → mem", mastered.json?.state?.labs?.L00?.mem === true);

const invalid = await req("POST", "/api/progress/reps", { token: tkA, body: { labId: "XX9" } });
check("labId inválido → 400 (zod)", invalid.status === 400);

console.log("3. EQUIPAS");
const team = await req("POST", "/api/teams", { body: { name: "Equipa HTTP" }, token: tkA });
const code = team.json?.inviteCode;
check(
  "criar equipa → 201 + código 8 chars",
  team.status === 201 && /^[A-Z2-9]{8}$/.test(code || ""),
  JSON.stringify(team.json),
);

const regB = await req("POST", "/api/auth/register", {
  body: { name: "Newbie HTTP", email: emailB, password: "teste-123" },
});
const tkB = regB.json.accessToken;

const joinBad = await req("POST", "/api/teams/join", { body: { code: "NAOEXIST" }, token: tkB });
check("código inválido → 404", joinBad.status === 404);

const join = await req("POST", "/api/teams/join", { body: { code }, token: tkB });
check("técnico entra por código", join.status === 200 && join.json?.name === "Equipa HTTP");

const meB = await req("GET", "/api/auth/me", { token: tkB });
check(
  "me do técnico → team + sem inviteCode",
  meB.json?.team?.name === "Equipa HTTP" && !meB.json?.team?.inviteCode,
);

const dashB = await req("GET", `/api/teams/${team.json.id}/dashboard`, { token: tkB });
check("dashboard → 403 para não-dono", dashB.status === 403);

await req("POST", "/api/progress/reps", { token: tkB, body: { labId: "L00" } });
const dash = await req("GET", `/api/teams/${team.json.id}/dashboard`, { token: tkA });
const members = dash.json?.members || [];
check(
  "dashboard do formador → 2 membros",
  dash.status === 200 && members.length === 2,
  JSON.stringify(members.map((m) => m.name)),
);
const boss = members.find((m) => m.email === emailA);
check(
  "resumo: mastered=1, reps=2, quiz=1, evid=1",
  boss?.mastered === 1 && boss?.reps === 2 && boss?.quizzesPassed === 1 && boss?.evidences === 1,
  JSON.stringify(boss),
);

console.log("4. IA (chaves cifradas + router)");
const putKeys = await req("PUT", `/api/teams/${team.json.id}/ai-settings`, {
  token: tkA,
  body: { keys: { groq: "gsk_falsa_123456" }, order: ["groq", "gemini"] },
});
check("guardar chave da equipa → ok", putKeys.status === 200);

const getKeyState = await req("GET", `/api/teams/${team.json.id}/ai-settings`, { token: tkA });
check(
  "chave mascarada (****3456) + ordem",
  getKeyState.json?.keys?.groq === "****3456" && getKeyState.json?.order?.[0] === "groq",
  JSON.stringify(getKeyState.json?.keys),
);

const keysB = await req("GET", `/api/teams/${team.json.id}/ai-settings`, { token: tkB });
check("ai-settings → 403 para técnico", keysB.status === 403);

const provs = await req("GET", "/api/ai/providers", { token: tkA });
const groqP = provs.json?.providers?.find((p) => p.id === "groq");
check(
  "providers → groq configurado (team)",
  groqP?.configured === true && groqP?.source === "team",
);

const chat = await req("POST", "/api/ai/chat", {
  token: tkA,
  body: { kind: "chat", messages: [{ role: "user", content: "diga OK" }], maxTokens: 50 },
});
check(
  "chat com chave falsa → 502 com diagnóstico do router",
  chat.status === 502 && /falharam/i.test(chat.json?.error || ""),
  String(chat.json?.error).slice(0, 110),
);

const test1 = await req("POST", "/api/ai/test", { token: tkA, body: {} });
const byId = Object.fromEntries((test1.json?.results || []).map((r) => [r.id, r]));
check(
  "POST /ai/test → testa todos: groq 'erro' (chave falsa), gemini 'sem-chave'",
  test1.status === 200 && byId.groq?.status === "erro" && byId.gemini?.status === "sem-chave",
  JSON.stringify({ groq: byId.groq?.status, gemini: byId.gemini?.status }),
);

const test2 = await req("POST", "/api/ai/test", { token: tkA, body: { id: "groq" } });
check(
  "POST /ai/test {id} → testa só o groq",
  test2.status === 200 &&
    test2.json?.results?.length === 1 &&
    test2.json?.results?.[0]?.id === "groq",
);

console.log("5. ROTAÇÃO DE REFRESH + SEGURANÇA");
const ref1 = await req("POST", "/api/auth/refresh", { body: { refreshToken: rtA } });
check(
  "refresh → novos tokens",
  ref1.status === 200 && ref1.json?.accessToken && ref1.json?.refreshToken !== rtA,
);
const ref2 = await req("POST", "/api/auth/refresh", { body: { refreshToken: rtA } });
check("reutilização do token antigo → 401 (rotação)", ref2.status === 401);
const ref3 = await req("POST", "/api/auth/refresh", {
  body: { refreshToken: ref1.json.refreshToken },
});
check("após deteção de roubo, tokens novos também revogados → 401", ref3.status === 401);

console.log("6. IMPORT LEGADO");
const login2 = await req("POST", "/api/auth/login", {
  body: { email: emailA, password: "teste-123" },
});
const tkA2 = login2.json.accessToken;
const imp = await req("POST", "/api/meta/import-legacy", {
  token: tkA2,
  body: {
    labs: {
      L05: {
        c: 3,
        due: "2026-10-01",
        mem: false,
        steps: { 0: true },
        proofs: {},
        hist: ["2026-09-01"],
      },
    },
    cards: { 7: { c: 2, due: "2026-09-30" } },
    evid: [{ d: "2026-08-01", lab: "L05", kind: "sql", txt: "query.sql" }],
    streak: { last: "2026-09-10", n: 12 },
    settings: { tts: false, aiKey: "sk-antiga-nao-importada" },
    dbSchema: "select 1",
  },
});
check(
  "import: labs/cartas/evid/streak migrados",
  imp.json?.imported?.labs === 1 &&
    imp.json?.state?.labs?.L05?.c === 3 &&
    imp.json?.state?.streak?.n === 12,
);
check("import: chave de IA antiga descartada", imp.json?.state?.settings?.aiKey === undefined);
check("import: tts preservado", imp.json?.state?.settings?.tts === false);
check("import: L00 local mantido (merge)", imp.json?.state?.labs?.L00?.mem === true);

const stats = await req("GET", "/api/meta/content-stats");
check("content-stats público → 90 missões", stats.json?.labs === 90);

const health = await req("GET", "/api/health");
check("health → mongo true", health.json?.mongo === true);

console.log(`\nRESULTADO: ${passed} ✔  ${failed} ✘`);
process.exit(failed ? 1 : 0);
