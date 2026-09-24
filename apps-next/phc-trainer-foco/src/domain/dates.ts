/**
 * Datas "de calendário" (YYYY-MM-DD) no fuso Europe/Lisbon.
 *
 * Bug corrigido do original: `todayISO()` usava o fuso do dispositivo. No servidor
 * (UTC) uma revisão feita às 00:30 em Lisboa (verão) contava para o dia anterior.
 * Aqui o "dia" é sempre o dia civil em Portugal — o público-alvo da formação.
 */
export const APP_TIME_ZONE = "Europe/Lisbon";

export type ISODate = string; // "YYYY-MM-DD"

export function todayISO(now: Date = new Date(), timeZone: string = APP_TIME_ZONE): ISODate {
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** soma dias a uma data de calendário, sem ambiguidades de hora de verão (usa UTC) */
export function addDays(iso: ISODate, days: number): ISODate {
  const [y, m, d] = iso.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** diferença em dias (b - a) */
export function diffDays(a: ISODate, b: ISODate): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

/** "hoje", "amanhã", "daqui a 3 dias", "há 2 dias" — linguagem concreta reduz a "cegueira temporal" */
export function relativeDay(target: ISODate, today: ISODate): string {
  const n = diffDays(today, target);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n === -1) return "ontem";
  if (n > 1) return `daqui a ${n} dias`;
  return `há ${-n} dias`;
}

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}
