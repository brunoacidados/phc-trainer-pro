import type { Metadata } from "next";
import Link from "next/link";
import { QUIZZES, beltName } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge, PageTitle } from "@/components/ui";
import { QUIZ_PASS_PCT, currentBelt } from "@/domain/progression";
import { loadSnapshot } from "@/server/queries";
import { requireProfile } from "@/server/session";

export const metadata: Metadata = { title: "Testes de nível" };

export default async function QuizListPage() {
  const profile = await requireProfile();
  const snap = await loadSnapshot(profile);
  const cur = currentBelt(snap);
  return (
    <div>
      <Breadcrumbs items={[{ label: "Praticar", href: "/praticar" }, { label: "Testes" }]} />
      <PageTitle subtitle={`Aprova com ${QUIZ_PASS_PCT}%. Pode repetir quantas vezes quiser — conta a melhor nota.`}>Testes de nível</PageTitle>
      <ul className="space-y-2">
        {QUIZZES.map((q) => {
          const st = snap.quizzes[q.lv];
          return (
            <li key={q.lv}>
              <Link
                href={`/praticar/testes/${q.lv}`}
                className={`flex min-h-16 flex-wrap items-center gap-3 rounded-2xl border-2 bg-surface px-5 py-3 hover:border-primary ${q.lv === cur ? "border-primary" : "border-line"}`}
              >
                <span className="flex-1">
                  <span className="block text-lg font-bold">
                    Nível {q.lv} · {beltName(q.lv)}
                  </span>
                  <span className="text-sm text-muted">{q.qs.length} perguntas</span>
                </span>
                {st?.passed ? (
                  <Badge tone="success">Aprovado · {st.best}%</Badge>
                ) : st ? (
                  <Badge tone="warn">Melhor: {st.best}%</Badge>
                ) : (
                  <Badge>Por fazer</Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
