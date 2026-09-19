/**
 * Templates HTML de marca para todos os emails (usados por SMTP e Resend).
 * Responsivos, CSS inline (compatível com clientes de email), acento #f5a623.
 * As mesmas estruturas servem de base aos Templates do Resend (scripts/resend-templates.mjs).
 */
import { env } from "../config/env.ts";

const BRAND = "PHC Trainer Pro";
const ACCENT = "#f5a623";

export function layout(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
  buttonHref?: string;
  buttonText?: string;
}): string {
  const btn = opts.buttonHref
    ? `<div style="margin:26px 0;text-align:center">
        <a href="${opts.buttonHref}" style="background:${ACCENT};color:#171103;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;text-decoration:none;display:inline-block">${opts.buttonText || "Abrir"}</a>
       </div>
       <p style="font-size:12px;color:#8a94ad;text-align:center;margin:0">Ou copia/abre este link:<br><a href="${opts.buttonHref}" style="color:#1f6fd0;word-break:break-all">${opts.buttonHref}</a></p>`
    : "";
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.title}</title></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:Segoe UI,system-ui,-apple-system,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e7ef">
        <tr><td style="background:#0d1220;padding:18px 24px">
          <span style="color:${ACCENT};font-weight:800;font-size:17px;letter-spacing:.5px">🧠 ${BRAND}</span>
          <span style="color:#93a0bd;font-size:12px;display:block;margin-top:2px">Formação · Gestão Cegid PHC Evolution</span>
        </td></tr>
        <tr><td style="padding:26px 26px 8px">
          <h1 style="margin:0 0 6px;font-size:20px;color:#1a2233">${opts.title}</h1>
          ${opts.bodyHtml}
          ${btn}
        </td></tr>
        <tr><td style="padding:16px 26px 22px;border-top:1px solid #eef1f6">
          <p style="margin:0;font-size:11.5px;color:#8a94ad;line-height:1.6">
            Este email foi enviado por ${BRAND} (${env.APP_URL}).<br>
            Se não pediste isto, ignora este email — nenhuma alteração será feita.<br>
            Sem evidência, não há aprendizado. 🎓
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const p = (html: string) =>
  `<p style="margin:0 0 12px;font-size:14.5px;color:#33405a;line-height:1.65">${html}</p>`;

export function verifyEmailHtml(name: string, link: string): string {
  return layout({
    title: "Confirma o teu email",
    preheader: "Confirma o teu email para ativar todas as funcionalidades do PHC Trainer Pro.",
    bodyHtml:
      p(`Olá <b>${name}</b> 👋`) +
      p(
        "Bem-vindo(a) ao <b>PHC Trainer Pro</b>. Confirma o teu email para ativar todas as funcionalidades da tua conta de formação.",
      ),
    buttonHref: link,
    buttonText: "✅ Confirmar email",
  });
}

export function resetEmailHtml(name: string, link: string): string {
  return layout({
    title: "Repor a tua password",
    preheader: "Pediste para repor a password do PHC Trainer Pro.",
    bodyHtml:
      p(`Olá <b>${name}</b>,`) +
      p(
        "Recebemos um pedido para repor a tua password. Carrega no botão para definir uma nova. O link expira em <b>60 minutos</b>.",
      ) +
      p(
        "<span style='font-size:12.5px;color:#8a94ad'>Se não foste tu, ignora este email — a password atual mantém-se.</span>",
      ),
    buttonHref: link,
    buttonText: "🔑 Repor password",
  });
}

export function welcomeEmailHtml(name: string, link: string): string {
  return layout({
    title: "A tua conta está pronta 🎉",
    preheader: "Conta criada no PHC Trainer Pro. Começa a tua jornada.",
    bodyHtml:
      p(`Olá <b>${name}</b>,`) +
      p(
        "A tua conta foi criada. Entra para escolheres a tua <b>empresa de treino</b>, receberes o plano de missões e começares a jornada com o Professor Einstein.",
      ),
    buttonHref: link,
    buttonText: "🚀 Começar agora",
  });
}

export function assignmentEmailHtml(
  name: string,
  title: string,
  due: string,
  link: string,
): string {
  return layout({
    title: "Nova atribuição de missões",
    preheader: `O formador atribuiu-te: ${title} (prazo ${due}).`,
    bodyHtml:
      p(`Olá <b>${name}</b>,`) +
      p(`O teu formador atribuiu-te: <b>${title}</b>.<br>Prazo: <b>${due}</b>.`),
    buttonHref: link,
    buttonText: "📌 Ver atribuição",
  });
}
