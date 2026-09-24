import Link from "next/link";
import type { Metadata } from "next";
import { CARDS, LEVELS, MISSIONS, QUIZZES } from "@/content";
import { CARD_MASTERED_BOX } from "@/domain/srs";
import { levelsCompleted, overallPct } from "@/domain/progression";
import { addDays } from "@/domain/dates";
import { loadDashboard } from "@/server/queries";
import { Breadcrumbs, PageTitle, ProgressBar } from "@/components/ui";

export const metadata: Metadata = { title: "O meu progresso" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const d = await loadDashboard();
  const s = d.snapshot;
  const mastered = Object.values(s.missions).filter((m) => m.mastered).length;
  const started = Object.keys(s.missions).length;
  const cardsMastered = Object.values(s.cards).filter((c) => c.box >= CARD_MASTERED_BOX).length;
  const pct = overallPct(s, { missions: MISSIONS.length, quizzes: QUIZZES.length, cards: CARDS.length });
  const lvDone = levelsCompleted(LEVELS.length, MISSIONS, s);
  const week = Array.from({ length: 7 }, (_, i) => addDays(d.today, i - 6));
  const active = new Set(d.activeDays);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { label: "O meu progresso" }]} />
      <PageTitle title="O meu progresso" lead="Números honestos: só conta como dominado o que tem prova e repetição espaçada." />

      <section className="card space-y-4 p-5">
        <ProgressBar value={pct} label="Progresso geral (missões 70% · testes 20% · cartas 10%)" />
        <ProgressBar value={(mastered / MISSIONS.length) * 100} label={`Missões dominadas: ${mastered} de ${MISSIONS.length} (${started} começadas)`} tone="ok" />
        <ProgressBar value={(s.quizzesPassed.size / QUIZZES.length) * 100} label={`Testes aprovados: ${s.quizzesPassed.size} de ${QUIZZES.length}`} tone="ok" />
        <ProgressBar value={(cardsMastered / CARDS.length) * 100} label={`Cartas dominadas: ${cardsMastered} de ${CARDS.length}`} tone="ok" />
      </section>

      <section className="card p-5">
        <h2 className="font-bold">Últimos 7 dias</h2>
        <ol className="mt-3 grid grid-cols-7 gap-2 text-center text-xs">
          {week.map((day) => (
            <li key={day}>
              <span className={`mx-auto grid h-10 w-10 place-items-center rounded-full border-2 text-base ${active.has(day) ? "border-ok bg-ok-soft text-ok" : "border-line text-ink-soft"}`}>
                {active.has(day) ? "✓" : "·"}
              </span>
              <span className="mt-1 block text-ink-soft">{new Date(day + "T12:00:00Z").toLocaleDateString("pt-PT", { weekday: "short" })}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-soft">Não há sequências para &ldquo;partir&rdquo;. Cada dia ativo conta por si.</p>
      </section>

      <section className="card p-5">
        <h2 className="font-bold">Níveis concluídos: {lvDone} de {LEVELS.length}</h2>
        <p className="mt-1 text-sm text-ink-soft">Um nível conclui-se com todas as missões dominadas e o teste aprovado.</p>
        <Link href="/trilha" className="link mt-2 inline-block">
          Ver a trilha
        </Link>
      </section>
    </div>
  );
}
