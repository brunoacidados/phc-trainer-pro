import type { Metadata } from "next";
import { CARDS, cardById } from "@/content";
import { CARD_SESSION_SIZE } from "@/domain/progression";
import { loadDashboard } from "@/server/queries";
import { Breadcrumbs } from "@/components/ui";
import { CardSession, type SessionCard } from "@/components/CardSession";

export const metadata: Metadata = { title: "Cartas" };
export const dynamic = "force-dynamic";

/** no máximo 5 cartas NOVAS por sessão: novidade demais = sobrecarga */
const MAX_NEW = 5;

export default async function CardsPage() {
  const d = await loadDashboard();
  const due = d.dueCardIds.slice(0, CARD_SESSION_SIZE);
  const room = Math.min(MAX_NEW, CARD_SESSION_SIZE - due.length);
  // novas: pela ordem do conteúdo (níveis baixos primeiro)
  const fresh = CARDS.filter((c) => d.newCardIds.includes(c.id))
    .slice(0, Math.max(0, room))
    .map((c) => c.id);
  const cards: SessionCard[] = [...due, ...fresh].map((id) => {
    const c = cardById(id)!;
    return { id, front: c.front, back: c.back, level: c.level, state: d.snapshot.cards[id] ?? null };
  });

  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { href: "/praticar", label: "Praticar" }, { label: "Cartas" }]} />
      <h1 className="mb-4 text-2xl font-extrabold">Cartas</h1>
      <CardSession cards={cards} today={d.today} />
    </div>
  );
}
