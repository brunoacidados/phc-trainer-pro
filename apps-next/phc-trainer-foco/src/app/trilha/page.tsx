import Link from "next/link";
import type { Metadata } from "next";
import { LEVELS, MISSIONS } from "@/content";
import { loadDashboard } from "@/server/queries";
import { Breadcrumbs, PageTitle, Pill } from "@/components/ui";

export const metadata: Metadata = { title: "Trilha" };
export const dynamic = "force-dynamic";

export default async function TrailPage() {
  const d = await loadDashboard();
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { label: "Trilha" }]} />
      <PageTitle
        kicker={`${LEVELS.length} níveis · ${MISSIONS.length} missões`}
        title="Trilha"
        lead="Siga a ordem se não tiver a certeza. Todos os níveis estão abertos: se já domina um tema, pode saltar."
      />
      <ol className="space-y-3">
        {LEVELS.map((lv) => {
          const ms = MISSIONS.filter((m) => m.level === lv.n);
          const mastered = ms.filter((m) => d.snapshot.missions[m.id]?.mastered).length;
          const started = ms.filter((m) => d.snapshot.missions[m.id]).length;
          const pct = ms.length ? (mastered / ms.length) * 100 : 0;
          return (
            <li key={lv.n}>
              <Link href={`/trilha/${lv.n}`} className="card flex items-center gap-4 p-4 no-underline hover:!border-accent">
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white"
                  style={{ background: lv.color, textShadow: "0 1px 2px rgb(0 0 0 / .6)" }}
                >
                  {lv.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{lv.name}</span>
                  <span className="block truncate text-sm text-ink-soft">{lv.description}</span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <span className="block h-full bg-ok" style={{ width: `${pct}%` }} />
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm">
                  {mastered === ms.length && ms.length > 0 ? (
                    <Pill tone="ok">Completo</Pill>
                  ) : started ? (
                    <span className="font-semibold text-ink">
                      {mastered}/{ms.length}
                    </span>
                  ) : (
                    <span className="text-ink-soft">{ms.length} missões</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
