import type { Metadata } from "next";
import { BELTS, labsOfLevel } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageTitle } from "@/components/ui";
import { currentBelt, dueMissions, levelStatus, missionAccessible, missionOf, recommendedMission } from "@/domain/progression";
import { loadSnapshot } from "@/server/queries";
import { requireProfile } from "@/server/session";
import { MissionBrowser, type LevelGroup, type MissionRow } from "./MissionBrowser";

export const metadata: Metadata = { title: "Missões" };

export default async function MissionsPage() {
  const profile = await requireProfile();
  const snap = await loadSnapshot(profile);
  const due = new Set(dueMissions(snap));
  const rec = recommendedMission(snap);

  const groups: LevelGroup[] = BELTS.map((b) => {
    const st = levelStatus(snap, b.n);
    const missions: MissionRow[] = labsOfLevel(b.n).map((l) => {
      const m = missionOf(snap, l.id);
      const status: MissionRow["status"] = m.mastered
        ? "dominada"
        : due.has(l.id)
          ? "rever"
          : m.reps > 0
            ? "praticada"
            : m.steps.length || m.proofs.length
              ? "em-curso"
              : "nova";
      return { id: l.id, title: l.t, min: l.min, status, accessible: missionAccessible(snap, l.id), recommended: l.id === rec };
    });
    return {
      level: b.n,
      name: b.name,
      desc: b.desc,
      open: st.open,
      missingToOpen: st.missingToOpen,
      mastered: st.mastered,
      practiced: missions.filter((m) => m.status !== "nova" && m.status !== "em-curso").length,
      missions,
    };
  }).filter((g) => g.missions.length > 0);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Missões" }]} />
      <PageTitle subtitle="Só o seu nível atual está aberto. Os outros ficam recolhidos para não distrair.">Missões</PageTitle>
      <MissionBrowser groups={groups} currentLevel={currentBelt(snap)} />
    </div>
  );
}
