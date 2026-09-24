import Link from "next/link";
import { CARDS, LEVELS, MISSIONS, QUIZZES, missionById } from "@/content";
import { DAILY_GOAL, nextAction, overallPct, type NextAction } from "@/domain/progression";
import { addDays } from "@/domain/dates";
import { loadDashboard } from "@/server/queries";
import { Disclosure, ProgressBar } from "@/components/ui";

export const dynamic = "force-dynamic";

function actionView(a: NextAction): { label: string; title: string; href: string; cta: string; minutes: string } {
  switch (a.kind) {
    case "continuar-missao": {
      const m = missionById(a.missionId)!;
      return { label: "Continuar", title: a.title, href: `/missao/${a.missionId}?etapa=3`, cta: "Continuar onde parei", minutes: `~${Math.round(m.minutes / 3)} min` };
    }
    case "rever-cartas":
      return { label: "Revisão rápida", title: `${a.count} cartas para rever`, href: "/praticar/cartas", cta: "Começar revisão", minutes: `~${Math.max(2, Math.ceil(a.count / 2))} min` };
    case "repetir-missao":
      return { label: "Repetição espaçada", title: a.title, href: `/missao/${a.missionId}?etapa=6`, cta: "Repetir de memória", minutes: missionById(a.missionId)!.repTime };
    case "nova-missao": {
      const m = missionById(a.missionId)!;
      return { label: `Nova missão · Nível ${m.level}`, title: a.title, href: `/missao/${a.missionId}`, cta: "Começar (só a etapa 1)", minutes: `etapa 1: ~2 min` };
    }
    case "tudo-feito":
      return { label: "Tudo em dia", title: "Nada pendente hoje", href: "/exemplos", cta: "Ver um exemplo de código (opcional)", minutes: "5 min" };
  }
}

export default async function TodayPage() {
  const d = await loadDashboard();
  const action = nextAction(MISSIONS, d.snapshot, d.dueCardIds.length, d.today);
  const v = actionView(action);
  const goalDone = Math.min(d.todayCount, DAILY_GOAL);
  const activeDays = new Set(d.activeDays.filter((x) => x >= addDays(d.today, -6))).size;
  const pct = overallPct(d.snapshot, { missions: MISSIONS.length, quizzes: QUIZZES.length, cards: CARDS.length });
  const newMissions = MISSIONS.filter((m) => !d.snapshot.missions[m.id]).slice(0, 1);
  const firstVisit = Object.keys(d.snapshot.missions).length === 0 && Object.keys(d.snapshot.cards).length === 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Hoje</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{firstVisit ? "Bem-vindo. Comece por aqui." : "A sua próxima ação"}</h1>
      </header>

      {/* UMA ação principal. Tudo o resto é secundário e visualmente mais fraco. */}
      <section aria-labelledby="proxima" className="card border-2 !border-accent p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-accent">{v.label}</p>
        <h2 id="proxima" className="mt-1 text-2xl font-bold leading-snug">
          {v.title}
        </h2>
        <p className="reading mt-2 text-ink-soft">{action.reason}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href={v.href} className="btn btn-primary text-lg">
            {v.cta} →
          </Link>
          <span className="text-sm text-ink-soft">⏱ {v.minutes}</span>
        </div>
      </section>

      {/* Meta diária pequena: 3 micro-ações. Cada passo marcado conta. */}
      <section aria-labelledby="meta" className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="meta" className="font-bold">
            Meta de hoje
          </h2>
          <span className="text-sm text-ink-soft">qualquer passo, prova ou carta conta</span>
        </div>
        <div className="mt-3 flex items-center gap-2" aria-label={`${goalDone} de ${DAILY_GOAL} micro-ações`}>
          {Array.from({ length: DAILY_GOAL }, (_, i) => (
            <span
              key={i}
              className={`grid h-10 w-10 place-items-center rounded-full border-2 text-lg font-bold ${
                i < goalDone ? "border-ok bg-ok text-surface" : "border-line text-ink-soft"
              }`}
            >
              {i < goalDone ? "✓" : i + 1}
            </span>
          ))}
          <span className="ml-2 font-semibold">
            {goalDone >= DAILY_GOAL ? "Meta cumprida. Pode parar aqui, de consciência tranquila." : `${goalDone}/${DAILY_GOAL}`}
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          Ativo em <strong className="text-ink">{activeDays} de 7</strong> dias esta semana. Falhar um dia não apaga nada.
        </p>
      </section>

      {firstVisit && (
        <section className="card p-5">
          <h2 className="font-bold">Como isto funciona (30 segundos)</h2>
          <ol className="reading mt-2 list-decimal space-y-1 pl-5">
            <li>Mostramos sempre <strong>uma</strong> próxima ação. Não precisa de decidir.</li>
            <li>Cada missão é dividida em 6 etapas curtas. Pode parar em qualquer uma.</li>
            <li>Só conta como dominado o que tiver <strong>prova</strong> e repetição noutro dia.</li>
          </ol>
          <Link href="/metodo" className="link mt-3 inline-block text-sm">
            Porquê este método? (fontes científicas)
          </Link>
        </section>
      )}

      <Disclosure summary="Prefiro fazer outra coisa">
        <ul className="space-y-2">
          <li>
            <Link className="link" href="/praticar/cartas">
              Rever cartas{d.dueCardIds.length ? ` (${d.dueCardIds.length} prontas)` : " novas"}
            </Link>
          </li>
          {newMissions.map((m) => (
            <li key={m.id}>
              <Link className="link" href={`/missao/${m.id}`}>
                Próxima missão nova: {m.title}
              </Link>
            </li>
          ))}
          <li>
            <Link className="link" href="/exemplos">
              Estudar um exemplo de código (errado → certo)
            </Link>
          </li>
          <li>
            <Link className="link" href="/trilha">
              Escolher na trilha ({LEVELS.length} níveis)
            </Link>
          </li>
        </ul>
      </Disclosure>

      <Disclosure summary={`Progresso geral: ${pct}%`}>
        <ProgressBar value={pct} label="Missões 70% · Testes 20% · Cartas 10%" />
        <Link href="/progresso" className="link mt-3 inline-block text-sm">
          Ver detalhe
        </Link>
      </Disclosure>
    </div>
  );
}
