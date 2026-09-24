import { beltName, labById } from "@/content";
import { DailyGoal, WeekDots } from "@/components/DailyGoal";
import { ButtonLink, Card, Disclosure, Emoji } from "@/components/ui";
import { lastNDays, weekdayShort } from "@/domain/dates";
import { dueMissions, missionOf, nextAction, recommendedMission, type NextAction } from "@/domain/progression";
import { loadActivityByDay, loadSnapshot } from "@/server/queries";
import { requireProfile } from "@/server/session";

function describe(a: NextAction) {
  switch (a.kind) {
    case "resume": {
      const lab = labById(a.missionId)!;
      return {
        eyebrow: "Continue de onde parou",
        title: lab.t,
        detail: `${a.missionId} · ${beltName(lab.lv)} · já começou esta missão`,
        cta: "Continuar missão",
        href: `/missoes/${a.missionId}`,
      };
    }
    case "review-mission": {
      const lab = labById(a.missionId)!;
      return {
        eyebrow: "Revisão marcada para hoje",
        title: lab.t,
        detail: `Repetir agora fixa a memória.${a.more ? ` Depois disto: mais ${a.more} revisão(ões).` : ""}`,
        cta: "Fazer revisão",
        href: `/missoes/${a.missionId}`,
      };
    }
    case "cards":
      return {
        eyebrow: "Revisão rápida",
        title: `${a.count} carta${a.count === 1 ? "" : "s"} para rever`,
        detail: `Sessão curta: no máximo 10 cartas (≈ 5 minutos).`,
        cta: "Rever cartas",
        href: "/praticar/cartas",
      };
    case "mission": {
      const lab = labById(a.missionId)!;
      return {
        eyebrow: "Próxima missão",
        title: lab.t,
        detail: `${a.missionId} · ${beltName(lab.lv)} · ≈ ${lab.min} min · ${lab.steps.length} passos`,
        cta: "Começar missão",
        href: `/missoes/${a.missionId}`,
      };
    }
    default:
      return {
        eyebrow: "Tudo em dia",
        title: "Não há nada pendente.",
        detail: "Pode descansar — ou fazer um teste de nível para consolidar.",
        cta: "Ver testes",
        href: "/praticar/testes",
      };
  }
}

export default async function TodayPage() {
  const profile = await requireProfile();
  const [snap, byDay] = await Promise.all([loadSnapshot(profile), loadActivityByDay(profile, 7)]);
  const action = nextAction(snap);
  const d = describe(action);
  const doneToday = byDay[snap.today] ?? 0;
  const week = lastNDays(snap.today, 7).map((day) => ({ day, label: weekdayShort(day), n: byDay[day] ?? 0 }));

  // alternativas (no máximo 2) — escondidas por defeito
  const alts: { label: string; href: string }[] = [];
  if (action.kind !== "cards" && snap.cardsDue > 0) alts.push({ label: `Rever ${snap.cardsDue} cartas`, href: "/praticar/cartas" });
  const due = dueMissions(snap).filter((id) => !(action.kind === "review-mission" && action.missionId === id));
  if (due[0]) alts.push({ label: `Revisão: ${labById(due[0])!.t}`, href: `/missoes/${due[0]}` });
  const rec = recommendedMission(snap);
  if (rec && !("missionId" in action && action.missionId === rec) && missionOf(snap, rec).reps === 0)
    alts.push({ label: `Nova missão: ${labById(rec)!.t}`, href: `/missoes/${rec}` });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Olá, {profile.name}.</h1>

      <Card className="pop border-primary">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">{d.eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold leading-snug sm:text-3xl">{d.title}</h2>
        <p className="mt-2 text-muted">{d.detail}</p>
        <div className="mt-5">
          <ButtonLink href={d.href} variant="primary" size="lg">
            {d.cta} →
          </ButtonLink>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Meta de hoje</h2>
        <DailyGoal done={doneToday} goal={profile.dailyGoal} />
      </Card>

      <div className="distraction space-y-3">
        {alts.length > 0 && (
          <Disclosure title="Prefiro fazer outra coisa" hint={`${alts.slice(0, 2).length} opções`}>
            <ul className="space-y-2">
              {alts.slice(0, 2).map((a) => (
                <li key={a.href}>
                  <ButtonLink href={a.href} className="w-full justify-start text-left">
                    {a.label}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
        <Disclosure title="A minha semana">
          <WeekDots days={week} />
        </Disclosure>
        <Disclosure title={<><Emoji>💡</Emoji> Como tirar o máximo daqui</>}>
          <ul className="prose-limit list-disc space-y-2 pl-5">
            <li>Faça só a próxima ação. O app decide a ordem por si.</li>
            <li>Tecla <kbd className="rounded border border-line px-1">F</kbd> = modo foco (esconde tudo o resto).</li>
            <li>Parou a meio? Não faz mal: o progresso fica guardado passo a passo.</li>
            <li>
              Quer saber porque funciona? Veja <a className="font-semibold text-primary underline" href="/aprender/metodo">o método</a>.
            </li>
          </ul>
        </Disclosure>
      </div>
    </div>
  );
}
