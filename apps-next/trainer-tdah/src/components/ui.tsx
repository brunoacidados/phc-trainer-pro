/**
 * Primitivas de UI. Regras:
 * - Alvos de toque ≥ 48px (WCAG 2.5.5 AAA pede 44px)
 * - Um só botão "primary" por ecrã/zona → a próxima ação é óbvia
 * - Estados comunicados por TEXTO + cor (nunca só cor — WCAG 1.4.1)
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-90",
  secondary: "bg-surface text-fg border-2 border-line hover:border-primary",
  ghost: "text-fg hover:bg-surface-2",
  danger: "bg-danger-soft text-danger border-2 border-danger/40 hover:border-danger",
  success: "bg-success-soft text-success border-2 border-success/40 hover:border-success",
};

export function btnClass(variant: Variant = "secondary", size: "md" | "lg" = "md", extra = "") {
  const s = size === "lg" ? "min-h-14 px-6 text-lg" : "min-h-12 px-4 text-base";
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${s} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: "md" | "lg" }) {
  return <button type="button" {...rest} className={btnClass(variant, size, className)} />;
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={btnClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "", as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={`rounded-2xl border-2 border-line bg-surface p-5 sm:p-6 ${className}`}>{children}</As>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "success" | "warn" | "danger" }) {
  const t = {
    neutral: "bg-surface-2 text-fg",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-semibold ${t}`}>{children}</span>;
}

export function ProgressBar({ value, max = 100, label, tone = "primary" }: { value: number; max?: number; label: string; tone?: "primary" | "success" }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-muted">
        <span>{label}</span>
        <span className="font-semibold text-fg">
          {value}/{max}
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div className={`bar h-full rounded-full ${tone === "success" ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Secção recolhível nativa (<details>) — divulgação progressiva acessível por teclado sem JS. */
export function Disclosure({ title, children, defaultOpen = false, hint }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; hint?: string }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border-2 border-line bg-surface">
      <summary className="flex min-h-14 items-center gap-3 px-5 py-3 font-semibold">
        <span className="chev inline-block text-muted" aria-hidden>
          ▶
        </span>
        <span className="flex-1">{title}</span>
        {hint && <span className="text-sm font-normal text-muted">{hint}</span>}
      </summary>
      <div className="border-t-2 border-line px-5 py-4">{children}</div>
    </details>
  );
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{children}</h1>
      {subtitle && <p className="prose-limit mt-2 text-lg text-muted">{subtitle}</p>}
    </header>
  );
}

export function Emoji({ children, label }: { children: string; label?: string }) {
  return label ? (
    <span className="emoji" role="img" aria-label={label}>
      {children}
    </span>
  ) : (
    <span className="emoji" aria-hidden>
      {children}
    </span>
  );
}
