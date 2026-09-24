import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Migalhas de pão sempre visíveis: responde a "onde estou?" sem esforço de memória.
 * Com TDAH, após uma interrupção, é comum perder o fio — as migalhas são a âncora.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Onde estou" className="mb-4 text-base">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
        <li>
          <Link href="/" className="underline-offset-4 hover:text-fg hover:underline">
            Hoje
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden>›</span>
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="underline-offset-4 hover:text-fg hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-fg">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
