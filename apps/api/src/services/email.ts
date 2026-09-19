/**
 * Serviço de email (Resend). NUNCA lança: devolve {sent, error?} para o caller decidir.
 * Notas Resend importantes:
 *  - Sem domínio verificado, o from default `onboarding@resend.dev` SÓ envia para o
 *    email dono da conta Resend. Para enviar a任意 utilizador, verifica um domínio
 *    teu e define EMAIL_FROM="algo@oteudominio.com" no Render.
 *  - APP_URL tem de ser o URL público da web (senão os links vão para localhost).
 */
import { env, isProd } from "../config/env.ts";

export interface SendResult {
  sent: boolean;
  error?: string;
  /** em dev sem Resend (ou falha), expõe o token/link para testes/admin */
  devToken?: string;
}

export function emailConfigWarning(): string | null {
  const problems: string[] = [];
  if (!env.RESEND_API_KEY) problems.push("RESEND_API_KEY não definida");
  if (/localhost|127\.0\.0\.1/.test(env.APP_URL))
    problems.push(`APP_URL parece local (${env.APP_URL}) — define o URL público da web`);
  if (!env.RESEND_API_KEY) return problems.join("; ");
  if (/onboarding@resend\.dev/.test(env.EMAIL_FROM))
    problems.push(
      "EMAIL_FROM é o default onboarding@resend.dev (só envia p/ o dono da conta Resend) — verifica um domínio e define EMAIL_FROM",
    );
  return problems.length ? problems.join("; ") : null;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  token?: string,
): Promise<SendResult> {
  if (!env.RESEND_API_KEY) {
    const devToken = token ?? (html.match(/token=([A-Za-z0-9._-]+)/) || [])[1];
    console.log(
      `[email] SEM RESEND_API_KEY — não enviado. para=${to} assunto="${subject}" token=${devToken ?? "-"}`,
    );
    if (isProd)
      return {
        sent: false,
        error: "Servidor de email não configurado (RESEND_API_KEY).",
        devToken,
      };
    return { sent: false, error: "Sem RESEND_API_KEY (dev): usa o link direto.", devToken };
  }
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
      return { sent: false, error: `Resend HTTP ${r.status}: ${t}`, devToken: token };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] erro:", (e as Error).message);
    return { sent: false, error: (e as Error).message, devToken: token };
  }
}

export function buttonHtml(href: string, label: string): string {
  return `<a href="${href}" style="background:#f5a623;color:#171103;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a>`;
}
