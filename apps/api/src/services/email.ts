/**
 * Serviço de email com DOIS transportadores (escolhidos por env):
 *  1) SMTP (nodemailer) — se SMTP_HOST/SMTP_USER/SMTP_PASS definidos. Funciona para
 *     QUALQUER destinatário sem verificar domínio (ex.: Gmail c/ app-password).
 *  2) Resend — se RESEND_API_KEY definido. NOTA: com from default onboarding@resend.dev
 *     SÓ envia p/ o dono da conta; para outros destinatários verifica um domínio e
 *     usa EMAIL_FROM=algo@oteudominio.com.
 * NUNCA lança: devolve {sent, error?, devToken?}.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { env, isProd } from "../config/env.ts";

export interface SendResult {
  sent: boolean;
  error?: string;
  devToken?: string;
}

const smtpConfigured = () => !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
const resendConfigured = () => !!env.RESEND_API_KEY;
const resendFromIsDefault = () => /onboarding@resend\.dev/.test(env.EMAIL_FROM);

export function emailProvider(): "smtp" | "resend" | "none" {
  if (smtpConfigured()) return "smtp";
  if (resendConfigured()) return "resend";
  return "none";
}

export function emailConfigWarning(): string | null {
  const p = emailProvider();
  if (p === "none")
    return "Nenhum transportador de email configurado (define SMTP_HOST/SMTP_USER/SMTP_PASS ou RESEND_API_KEY)";
  if (p === "resend" && resendFromIsDefault())
    return "Resend com from default onboarding@resend.dev SÓ envia p/ o dono da conta — verifica um domínio (resend.com/domains) e define EMAIL_FROM, ou configura SMTP";
  if (/localhost|127\.0\.0\.1/.test(env.APP_URL))
    return `APP_URL parece local (${env.APP_URL}) — define o URL público da web para os links funcionarem`;
  return null;
}

let transporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (transporter) return transporter;
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : Number(env.SMTP_PORT) === 465;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || (secure ? 465 : 587),
    secure,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  token?: string,
): Promise<SendResult> {
  const devToken = token ?? (html.match(/token=([A-Za-z0-9._-]+)/) || [])[1];
  const p = emailProvider();

  if (p === "none") {
    console.log(`[email] SEM transportador — não enviado. para=${to} assunto="${subject}"`);
    return { sent: false, error: "Servidor de email não configurado.", devToken };
  }

  if (p === "smtp") {
    try {
      await getTransporter().sendMail({ from: env.EMAIL_FROM, to, subject, html });
      return { sent: true };
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`[email] SMTP erro: ${msg}`);
      return { sent: false, error: `SMTP: ${msg}`, devToken };
    }
  }

  // resend
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
    });
    if (!r.ok) {
      const t = (await r.text()).slice(0, 200);
      console.error(`[email] Resend HTTP ${r.status}: ${t}`);
      return { sent: false, error: `Resend HTTP ${r.status}: ${t}`, devToken };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] erro:", (e as Error).message);
    return { sent: false, error: (e as Error).message, devToken };
  }
}

export function buttonHtml(href: string, label: string): string {
  return `<a href="${href}" style="background:#f5a623;color:#171103;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a>`;
}

export { isProd };
