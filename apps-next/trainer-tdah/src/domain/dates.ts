/**
 * Datas como strings ISO "AAAA-MM-DD" num fuso horário explícito.
 *
 * CORREÇÃO face ao original: lá "hoje" era calculado no fuso do dispositivo/servidor.
 * Num servidor em UTC, um aluno em Lisboa que estude às 00:30 de verão teria a
 * atividade contada no dia anterior (streak e revisões errados). Aqui o fuso é
 * sempre explícito.
 */
export const DEFAULT_TZ = "Europe/Lisbon";

export function todayISO(timeZone: string = DEFAULT_TZ, now: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Soma n dias a uma data ISO. Usa meio-dia UTC para ser imune a mudanças de hora. */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Diferença em dias (b - a). */
export function diffDays(a: string, b: string): number {
  const ms = new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

/** Os últimos n dias, do mais antigo para hoje. */
export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export function weekdayShort(iso: string): string {
  return WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];
}

/** "hoje", "amanhã", "em 3 dias", "há 2 dias" — linguagem direta em vez de datas cruas. */
export function relativeDay(target: string, today: string): string {
  const d = diffDays(today, target);
  if (d === 0) return "hoje";
  if (d === 1) return "amanhã";
  if (d === -1) return "ontem";
  return d > 0 ? `em ${d} dias` : `há ${-d} dias`;
}
