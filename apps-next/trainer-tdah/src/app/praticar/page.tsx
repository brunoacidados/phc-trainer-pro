import type { Metadata } from "next";
import { CARDS, QUIZZES } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink, Card, Emoji, PageTitle } from "@/components/ui";
import { quizzesPassed } from "@/domain/progression";
import { loadSnapshot } from "@/server/queries";
import { requireProfile } from "@/server/session";

export const metadata: Metadata = { title: "Praticar" };

export default async function PracticePage() {
  const profile = await requireProfile();
  const snap = await loadSnapshot(profile);
  const session = Math.min(10, snap.cardsDue + Math.min(5, snap.cardsNew));
  return (
    <div>
      <Breadcrumbs items={[{ label: "Praticar" }]} />
      <PageTitle subtitle="Duas formas de treinar a memória. Escolha uma.">Praticar</PageTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={snap.cardsDue > 0 ? "border-primary" : ""}>
          <h2 className="text-2xl font-bold">
            <Emoji>🃏</Emoji> Cartas
          </h2>
          <p className="mt-2 text-muted">Pergunta → pensa → vê a resposta → avalia. Sessões de no máximo 10 cartas.</p>
          <ul className="my-4 space-y-1">
            <li>
              <b>{snap.cardsDue}</b> para rever hoje
            </li>
            <li>
              <b>{snap.cardsNew}</b> novas · <b>{snap.cardsMastered}</b>/{CARDS.length} dominadas
            </li>
          </ul>
          {session > 0 ? (
            <ButtonLink href="/praticar/cartas" variant={snap.cardsDue > 0 ? "primary" : "secondary"} size="lg">
              Começar sessão ({session} cartas)
            </ButtonLink>
          ) : (
            <p className="font-semibold text-success">Nada para hoje ✓</p>
          )}
        </Card>
        <Card>
          <h2 className="text-2xl font-bold">
            <Emoji>📝</Emoji> Testes de nível
          </h2>
          <p className="mt-2 text-muted">Uma pergunta de cada vez, com explicação imediata. Aprova com 80%.</p>
          <p className="my-4">
            <b>{quizzesPassed(snap)}</b>/{QUIZZES.length} testes aprovados
          </p>
          <ButtonLink href="/praticar/testes" size="lg">
            Escolher teste
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
