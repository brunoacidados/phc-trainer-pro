import Link from "next/link";
import type { Metadata } from "next";
import { EXAMPLES } from "@/content/examples";
import { Breadcrumbs, PageTitle, Pill } from "@/components/ui";

export const metadata: Metadata = { title: "Exemplos de código" };

export default function ExamplesPage() {
  const groups = (["Operação", "SQL", "Xbase"] as const).map((tag) => ({ tag, items: EXAMPLES.filter((e) => e.tag === tag) }));
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { label: "Código" }]} />
      <PageTitle
        kicker={`${EXAMPLES.length} exemplos resolvidos`}
        title="Código: errado → certo → porquê"
        lead="Cada exemplo resolve um problema real de um técnico PHC, com foco em tratamento de erros e segurança. 5 a 9 minutos cada."
      />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.tag}>
            <h2 className="mb-3 text-lg font-bold">{g.tag}</h2>
            <ul className="space-y-3">
              {g.items.map((e) => (
                <li key={e.slug}>
                  <Link href={`/exemplos/${e.slug}`} className="card block p-4 no-underline hover:!border-accent">
                    <p className="font-bold text-ink">{e.title}</p>
                    <p className="mt-1 text-ink-soft">{e.outcome}</p>
                    <p className="mt-2 flex flex-wrap gap-2 text-sm">
                      <Pill tone="accent">{e.tag}</Pill>
                      <Pill>Nível {e.level}</Pill>
                      <Pill>⏱ {e.minutes} min</Pill>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
