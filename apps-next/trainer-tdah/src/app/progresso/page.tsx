import type { Metadata } from "next";
import { BELTS, CARDS, LABS, QUIZZES, labsOfLevel } from "@/content";
import { WeekDots } from "@/components/DailyGoal";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, Disclosure, PageTitle, ProgressBar } from "@/components/ui";
import { lastNDays, weekdayShort } from "@/domain/dates";
import { currentBelt, labsMastered, missionOf, overallPct, quizzesPassed } from "@/domain/progression";
import { loadActivityByDay, loadSnapshot } from "@/server/queries";
import { requireProfile } from "@/server/session";

export const metadata: Metadata = { title: "Progresso" };

export default async function ProgressPage() {
  const profile = await requireProfile();
  const [snap, byDay] = await Promise.all([loadSnapshot(profile), loadActivityByDay(profile, 7)]);
  const belt = currentBelt(snap);
  const pct = overallPct(snap, CARDS.length);
  const practiced = LABS.filter((l) => missionOf(snap, l.id).reps > 0).length;
  const week = lastNDays(snap.today, 7).map((day) => ({ day, label: weekdayShort(day), n: byDay[day] ?? 0 }));

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Progresso" }]} />
      <PageTitle subtitle="O essencial primeiro. Os detalhes por nível estão recolhidos em baixo.">Progresso</PageTitle>

      <Card className="border-primary">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Está no</p>
        <p className="mt-1 flex items-center gap-3 text-3xl font-bold">
          <span className="inline-block h-6 w-6 rounded-full border-2 border-line" style={{ background: BELTS[belt]?.cor }} aria-hidden />
          Nível {belt} · {BELTS[belt]?.name}
        </p>
        <p className="prose-limit mt-2 text-muted">{BELTS[belt]?.desc}</p>
        <div className="mt-5">
          <ProgressBar value={pct} max={100} label="Domínio do curso (%) — missões 70% · testes 20% · cartas 10%" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-muted">Missões praticadas</p>
          <p className="text-3xl font-bold">
            {practiced}
            <span className="text-lg text-muted">/{LABS.length}</span>
          </p>
          <p className="text-sm text-muted">{labsMastered(snap)} dominadas</p>
        </Card>
        <Card>
          <p className="text-muted">Cartas dominadas</p>
          <p className="text-3xl font-bold">
            {snap.cardsMastered}
            <span className="text-lg text-muted">/{CARDS.length}</span>
          </p>
          <p className="text-sm text-muted">{snap.cardsDue} para rever hoje</p>
        </Card>
        <Card>
          <p className="text-muted">Testes aprovados</p>
          <p className="text-3xl font-bold">
            {quizzesPassed(snap)}
            <span className="text-lg text-muted">/{QUIZZES.length}</span>
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Últimos 7 dias</h2>
        <WeekDots days={week} />
      </Card>

      <Disclosure title="Detalhe por nível" hint={`${BELTS.length} níveis`}>
        <ul className="space-y-4">
          {BELTS.map((b) => {
            const labs = labsOfLevel(b.n);
            if (!labs.length) return null;
            const done = labs.filter((l) => missionOf(snap, l.id).reps > 0).length;
            const q = snap.quizzes[b.n];
            return (
              <li key={b.n}>
                <ProgressBar value={done} max={labs.length} label={`Nível ${b.n} · ${b.name}${q?.passed ? " · teste ✓" : ""}`} tone={done === labs.length ? "success" : "primary"} />
              </li>
            );
          })}
        </ul>
      </Disclosure>
    </div>
  );
}
