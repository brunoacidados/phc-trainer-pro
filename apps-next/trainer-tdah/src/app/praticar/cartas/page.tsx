import type { Metadata } from "next";
import { CARDS, beltName, cardKey } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pickSession } from "@/domain/srs";
import { loadCardStates, profileToday } from "@/server/queries";
import { requireProfile } from "@/server/session";
import { CardSession } from "./CardSession";

export const metadata: Metadata = { title: "Cartas" };

export default async function CardsPage() {
  const profile = await requireProfile();
  const states = await loadCardStates(profile.id);
  const today = profileToday(profile);
  // ordem do curso (por nível) → as cartas novas seguem a progressão pedagógica
  const ordered = [...CARDS].sort((a, b) => a.lv - b.lv);
  const keys = ordered.map(cardKey);
  const byKey = new Map(ordered.map((c) => [cardKey(c), c]));
  const session = pickSession(keys, states, today, { size: 10, maxNew: 5 }).map((k) => {
    const c = byKey.get(k)!;
    return { key: k, front: c.t, back: c.b, level: `Nível ${c.lv} · ${beltName(c.lv)}`, isNew: !states[k] };
  });
  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Praticar", href: "/praticar" }, { label: "Cartas" }]} />
      <CardSession cards={session} />
    </div>
  );
}
