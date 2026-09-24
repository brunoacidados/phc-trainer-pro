import type { Metadata } from "next";
import Link from "next/link";
import { CODE_EXAMPLES } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Exemplos de código" };

export default function ExamplesPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Aprender", href: "/aprender" }, { label: "Exemplos de código" }]} />
      <PageTitle subtitle="Cada exemplo mostra um problema real, a versão que parece funcionar mas falha, a versão correta e como confirmar.">
        Exemplos de código
      </PageTitle>
      <ul className="space-y-2">
        {CODE_EXAMPLES.map((e) => (
          <li key={e.id}>
            <Link href={`/aprender/exemplos/${e.id}`} className="flex min-h-16 flex-wrap items-center gap-3 rounded-2xl border-2 border-line bg-surface px-5 py-3 hover:border-primary">
              <span className="flex-1 text-lg font-semibold">{e.title}</span>
              <Badge tone="primary">{e.language === "sql" ? "SQL" : "Xbase"}</Badge>
              <span className="text-sm text-muted">Missões {e.missions.join(", ")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
