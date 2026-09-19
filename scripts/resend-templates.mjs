/**
 * Cria + publica os Templates de email no Resend (Templates API).
 * Uso:  RESEND_API_KEY=re_... node scripts/resend-templates.mjs
 *
 * Cria 4 templates (welcome, verify, reset, assignment) com variáveis {{{NAME}}},
 * {{{LINK}}}, {{{TITLE}}}, {{{DUE}}} e publica-os. Depois podes enviá-los com
 * resend.emails.send({ template: <id>, variables: {...} }) ou geri-los no dashboard.
 */
const KEY = process.env.RESEND_API_KEY;
if (!KEY) {
  console.error("Define RESEND_API_KEY=re_... para criar os templates.");
  process.exit(1);
}

const ACCENT = "#f5a623";
const layout = (title, bodyHtml, btnText) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:Segoe UI,system-ui,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e3e7ef">
<tr><td style="background:#0d1220;padding:18px 24px">
<span style="color:${ACCENT};font-weight:800;font-size:17px">🧠 PHC Trainer Pro</span>
<span style="color:#93a0bd;font-size:12px;display:block;margin-top:2px">Formação · Gestão Cegid PHC Evolution</span>
</td></tr>
<tr><td style="padding:26px">
<h1 style="margin:0 0 8px;font-size:20px;color:#1a2233">${title}</h1>
${bodyHtml}
<div style="margin:26px 0;text-align:center">
<a href="{{{LINK}}}" style="background:${ACCENT};color:#171103;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;text-decoration:none;display:inline-block">${btnText}</a>
</div>
<p style="font-size:12px;color:#8a94ad;text-align:center">Ou abre: <a href="{{{LINK}}}" style="color:#1f6fd0;word-break:break-all">{{{LINK}}}</a></p>
</td></tr>
<tr><td style="padding:16px 26px;border-top:1px solid #eef1f6">
<p style="margin:0;font-size:11.5px;color:#8a94ad">PHC Trainer Pro · se não pediste isto, ignora este email. 🎓</p>
</td></tr>
</table></td></tr></table></body></html>`;

const P = (t) => `<p style="margin:0 0 12px;font-size:14.5px;color:#33405a;line-height:1.65">${t}</p>`;

const TEMPLATES = [
  {
    name: "phc-welcome",
    subject: "A tua conta está pronta 🎉",
    html: layout("Bem-vindo(a), {{{NAME}}} 🎉", P("A tua conta foi criada. Entra para escolheres a empresa de treino e começares a jornada."), "🚀 Começar agora"),
    variables: [
      { key: "NAME", type: "string", fallbackValue: "colega" },
      { key: "LINK", type: "string", fallbackValue: "https://phc-trainer-pro-web.vercel.app" },
    ],
  },
  {
    name: "phc-verify-email",
    subject: "Confirma o teu email",
    html: layout("Confirma o teu email, {{{NAME}}}", P("Confirma o teu email para ativar todas as funcionalidades da tua conta de formação."), "✅ Confirmar email"),
    variables: [
      { key: "NAME", type: "string", fallbackValue: "colega" },
      { key: "LINK", type: "string", fallbackValue: "#" },
    ],
  },
  {
    name: "phc-reset-password",
    subject: "Repor a tua password",
    html: layout("Repor password, {{{NAME}}}", P("Pediste para repor a password. O link expira em 60 minutos.") + P("<span style='font-size:12.5px;color:#8a94ad'>Se não foste tu, ignora.</span>"), "🔑 Repor password"),
    variables: [
      { key: "NAME", type: "string", fallbackValue: "colega" },
      { key: "LINK", type: "string", fallbackValue: "#" },
    ],
  },
  {
    name: "phc-assignment",
    subject: "Nova atribuição: {{{TITLE}}}",
    html: layout("Nova atribuição, {{{NAME}}}", P("O formador atribuiu-te: <b>{{{TITLE}}}</b>.<br>Prazo: <b>{{{DUE}}}</b>."), "📌 Ver atribuição"),
    variables: [
      { key: "NAME", type: "string", fallbackValue: "colega" },
      { key: "TITLE", type: "string", fallbackValue: "Missões" },
      { key: "DUE", type: "string", fallbackValue: "-" },
      { key: "LINK", type: "string", fallbackValue: "#" },
    ],
  },
];

async function main() {
  for (const t of TEMPLATES) {
    const create = await fetch("https://api.resend.com/templates", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: t.name, subject: t.subject, html: t.html, variables: t.variables }),
    });
    if (!create.ok) {
      const b = await create.text();
      // se já existe, tenta listar p/ obter id e atualizar
      if (create.status === 409 || /already|duplicate/i.test(b)) {
        const list = await fetch("https://api.resend.com/templates?limit=50", { headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
        const existing = (list.data || []).find((x) => x.name === t.name);
        if (existing) {
          const upd = await fetch(`https://api.resend.com/templates/${existing.id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ subject: t.subject, html: t.html, variables: t.variables }),
          });
          const pub = await fetch(`https://api.resend.com/templates/${existing.id}/publish`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` } });
          console.log(`↻ ${t.name}: atualizado=${upd.ok} publicado=${pub.ok} id=${existing.id}`);
          continue;
        }
      }
      console.error(`✗ ${t.name}: HTTP ${create.status} ${b.slice(0, 150)}`);
      continue;
    }
    const j = await create.json();
    const pub = await fetch(`https://api.resend.com/templates/${j.id}/publish`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` } });
    console.log(`✓ ${t.name}: criado id=${j.id} publicado=${pub.ok}`);
  }
  console.log("\nTemplates prontos no dashboard Resend. Para enviar com template: resend.emails.send({ template: <id>, variables: { NAME, LINK, ... } }).");
}
main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
