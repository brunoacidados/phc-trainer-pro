import Link from "next/link";
import type { ReactNode } from "react";

/** Migalhas: dizem sempre "onde estou" e "como volto" — âncora contra a desorientação. */
export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Onde está" className="mb-4 text-sm text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {it.href ? (
              <Link href={it.href} className="link">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Barra de progresso com texto: a percentagem é sempre legível, não só a cor. */
export function ProgressBar({ value, label, tone = "accent" }: { value: number; label: string; tone?: "accent" | "ok" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${tone === "ok" ? "bg-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "accent" | "bad" }) {
  const cls = {
    neutral: "bg-surface-2 text-ink-soft",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    accent: "bg-accent-soft text-accent",
    bad: "bg-bad-soft text-bad",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${cls}`}>{children}</span>;
}

export function Callout({ tone = "accent", title, children }: { tone?: "accent" | "ok" | "warn" | "bad"; title?: string; children: ReactNode }) {
  const cls = {
    accent: "border-accent bg-accent-soft",
    ok: "border-ok bg-ok-soft",
    warn: "border-warn bg-warn-soft",
    bad: "border-bad bg-bad-soft",
  }[tone];
  return (
    <div className={`rounded-xl border-l-4 p-4 ${cls}`}>
      {title && <p className="mb-1 font-bold">{title}</p>}
      <div className="text-ink">{children}</div>
    </div>
  );
}

export function PageTitle({ kicker, title, lead }: { kicker?: string; title: string; lead?: string }) {
  return (
    <header className="mb-6">
      {kicker && <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">{kicker}</p>}
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{title}</h1>
      {lead && <p className="reading mt-2 text-lg text-ink-soft">{lead}</p>}
    </header>
  );
}

/** Divulgação progressiva: detalhe disponível a 1 clique, fechado por omissão. */
export function Disclosure({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="card group" open={defaultOpen}>
      <summary className="flex min-h-12 items-center gap-3 px-4 py-3 font-semibold">
        <span aria-hidden className="chev inline-block text-ink-soft">
          ›
        </span>
        <span className="flex-1">{summary}</span>
      </summary>
      <div className="border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}

export const STATUS_LABEL: Record<string, { text: string; tone: "neutral" | "ok" | "warn" | "accent" }> = {
  nova: { text: "Nova", tone: "neutral" },
  "em-curso": { text: "Em curso", tone: "accent" },
  "a-rever": { text: "Repetir hoje", tone: "warn" },
  dominada: { text: "Dominada ✓", tone: "ok" },
};
