import Link from "next/link";
import { notFound } from "next/navigation";
import { levelByN, missionsOfLevel, quizOfLevel } from "@/content";
import { missionCompletion, missionStatus } from "@/domain/progression";
import { loadDashboard } from "@/server/queries";
import { Breadcrumbs, PageTitle, Pill, STATUS_LABEL } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ nivel: string }> }) {
  const lv = levelByN(Number((await params).nivel));
  return { title: lv ? `Nível ${lv.n} — ${lv.name}` : "Nível" };
}

export default async function LevelPage({ params }: { params: Promise<{ nivel: string }> }) {
  const n = Number((await params).nivel);
  const lv = Number.isInteger(n) ? levelByN(n) : undefined;
  if (!lv) notFound();
  const missions = missionsOfLevel(lv.n);
  const quiz = quizOfLevel(lv.n);
  const d = await loadDashboard();
  const best = d.bestQuiz[lv.n];

  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { href: "/trilha", label: "Trilha" }, { label: `Nível ${lv.n}` }]} />
      <PageTitle kicker={`Nível ${lv.n}`} title={lv.name} lead={lv.description} />

      <ol className="space-y-3">
        {missions.map((m, i) => {
          const p = d.snapshot.missions[m.id];
          const st = STATUS_LABEL[missionStatus(p, d.today)];
          const c = missionCompletion(m, p);
          return (
            <li key={m.id}>
              <Link href={`/missao/${m.id}`} className="card block p-4 no-underline hover:!border-accent">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-7 shrink-0 text-right font-bold text-ink-soft">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{m.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                      <Pill tone={st.tone}>{st.text}</Pill>
                      <span>⏱ {m.minutes} min no total</span>
                      <span>· {m.steps.length} passos</span>
                    </p>
                    {c > 0 && c < 1 && (
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full bg-accent" style={{ width: `${c * 100}%` }} />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {quiz && (
        <section className="card mt-6 p-5">
          <h2 className="font-bold">Teste do nível ({quiz.questions.length} perguntas)</h2>
          <p className="mt-1 text-ink-soft">
            Aprovação com 80%. Pode repetir quantas vezes quiser — cada tentativa é treino.
            {best !== undefined && (
              <>
                {" "}
                Melhor resultado: <strong className="text-ink">{best}%</strong>.
              </>
            )}
          </p>
          <Link href={`/praticar/testes/${lv.n}`} className="btn btn-secondary mt-3">
            Fazer o teste
          </Link>
        </section>
      )}

      <nav className="mt-8 flex justify-between text-sm" aria-label="Níveis vizinhos">
        {lv.n > 0 ? (
          <Link className="link" href={`/trilha/${lv.n - 1}`}>
            ← Nível {lv.n - 1}
          </Link>
        ) : (
          <span />
        )}
        {levelByN(lv.n + 1) && (
          <Link className="link" href={`/trilha/${lv.n + 1}`}>
            Nível {lv.n + 1} →
          </Link>
        )}
      </nav>
    </div>
  );
}
