/**
 * Serviço de email via Resend (free tier). Sem RESEND_API_KEY, em desenvolvimento
 * devolve o token no response/log (para testar); em produção exige a chave.
 */
import { env, isProd } from "../config/env.ts";

export interface SendResult {
  sent: boolean;
  /** em dev sem Resend, expõe o link/token para testes */
  devToken?: string;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const key = env.RESEND_API_KEY;
  if (!key) {
    // sem provider: loga e (fora de produção) devolve p/ testes
    const m = html.match(/token=([A-Za-z0-9._-]+)/) || html.match(/\/([A-Za-z0-9._-]{20,})/);
    const devToken = m ? m[1] : undefined;
    console.log(`[email] (sem RESEND_API_KEY) para=${to} assunto="${subject}" devToken=${devToken ?? "-"}`);
    if (isProd) throw new Error("RESEND_API_KEY não configurada — não é possível enviar emails em produção.");
    return { sent: false, devToken };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
  });
  if (!r.ok) throw new Error(`Resend HTTP ${r.status}: ${(await r.text()).slice(0, 150)}`);
  return { sent: true };
}

export function buttonHtml(href: string, label: string): string {
  return `<a href="${href}" style="background:#f5a623;color:#171103;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a>`;
}
