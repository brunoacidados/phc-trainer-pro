import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { beltName, examplesForMission, labById, theoryFor } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink, Card } from "@/components/ui";
import { levelStatus, missionAccessible, missionOf } from "@/domain/progression";
import { relativeDay } from "@/domain/dates";
import { loadMissionStates, loadSnapshot } from "@/server/queries";
import { requireProfile } from "@/server/session";
import { MissionRunner } from "./MissionRunner";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lab = labById(id.toUpperCase());
  return { title: lab ? `${lab.id} · ${lab.t}` : "Missão" };
}

export default async function MissionPage({ params }: Props) {
  const { id: raw } = await params;
  const id = raw.toUpperCase();
  const lab = labById(id);
  if (!lab) notFound();
  const profile = await requireProfile();
  const [snap, states] = await Promise.all([loadSnapshot(profile), loadMissionStates(profile.id)]);
  const crumbs = [
    { label: "Missões", href: "/missoes" },
    { label: `Nível ${lab.lv} · ${beltName(lab.lv)}`, href: "/missoes" },
    { label: lab.id },
  ];

  if (!missionAccessible(snap, id)) {
    const st = levelStatus(snap, lab.lv);
    return (
      <div>
        <Breadcrumbs items={crumbs} />
        <Card>
          <h1 className="text-2xl font-bold">🔒 Esta missão ainda está fechada</h1>
          <p className="prose-limit mt-2 text-muted">
            Pratique mais {st.missingToOpen} missão(ões) do nível {lab.lv - 1} para abrir o nível {lab.lv}. Prefere explorar livremente? Ative o
            &quot;modo livre&quot; nas Definições.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/" variant="primary">
              Ir para a próxima ação
            </ButtonLink>
            <ButtonLink href="/definicoes">Definições</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const m = missionOf(snap, id);
  const notes = states[id]?.notes ?? "";
  const theory = theoryFor(id);
  const prereqs = lab.pre.map((p) => ({ id: p, title: labById(p)?.t ?? p, done: missionOf(snap, p).reps > 0 }));

  return (
    <div>
      <Breadcrumbs items={crumbs} />
      <header className="mb-6">
        <p className="font-mono text-muted">
          {lab.id} · ≈ {lab.min} min · meta depois de dominar: {lab.meta}
        </p>
        <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{lab.t}</h1>
        <p className="mt-2 text-muted" role="status">
          {m.mastered
            ? "Dominada ✓"
            : m.reps > 0
              ? `${m.reps} repetição(ões) · próxima revisão ${m.due ? relativeDay(m.due, snap.today) : "—"}`
              : "Ainda não praticada"}
        </p>
      </header>
      <MissionRunner
        lab={lab}
        theory={theory ?? null}
        examples={examplesForMission(id)}
        prereqs={prereqs}
        initial={{ steps: m.steps, proofs: m.proofs, notes, box: m.box, reps: m.reps, mastered: m.mastered }}
      />
    </div>
  );
}
