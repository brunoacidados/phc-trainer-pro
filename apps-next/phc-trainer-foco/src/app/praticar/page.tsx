import Link from "next/link";
import type { Metadata } from "next";
import { CARDS, QUIZZES } from "@/content";
import { CARD_MASTERED_BOX } from "@/domain/srs";
import { loadDashboard } from "@/server/queries";
import { Breadcrumbs, PageTitle, Pill } from "@/components/ui";

export const metadata: Metadata = { title: "Praticar" };
export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const d = await loadDashboard();
  const mastered = Object.values(d.snapshot.cards).filter((c) => c.box >= CARD_MASTERED_BOX).length;
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { label: "Praticar" }]} />
      <PageTitle title="Praticar" lead="Duas formas de treinar a memória. Ambas curtas." />

      <section className="card border-2 !border-accent p-6">
        <h2 className="text-xl font-bold">🃏 Cartas</h2>
        <p className="mt-1 text-ink-soft">Sessões de 10 cartas no máximo. Cerca de 5 minutos.</p>
        <p className="mt-3 flex flex-wrap gap-2">
          <Pill tone={d.dueCardIds.length ? "warn" : "ok"}>{d.dueCardIds.length} para rever</Pill>
          <Pill>{d.newCardIds.length} novas</Pill>
          <Pill tone="ok">
            {mastered}/{CARDS.length} dominadas
          </Pill>
        </p>
        <Link href="/praticar/cartas" className="btn btn-primary mt-4">
          Começar sessão de cartas →
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-bold">📝 Testes de nível</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {QUIZZES.map((q) => {
            const best = d.bestQuiz[q.level];
            const passed = d.snapshot.quizzesPassed.has(q.level);
            return (
              <li key={q.level}>
                <Link href={`/praticar/testes/${q.level}`} className="card flex items-center justify-between gap-2 p-3 no-underline hover:!border-accent">
                  <span className="min-w-0">
                    <span className="block text-sm text-ink-soft">Nível {q.level}</span>
                    <span className="block truncate font-semibold text-ink">{q.name}</span>
                  </span>
                  {passed ? <Pill tone="ok">{best}% ✓</Pill> : best !== undefined ? <Pill tone="warn">{best}%</Pill> : <Pill>{q.questions.length} p.</Pill>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
