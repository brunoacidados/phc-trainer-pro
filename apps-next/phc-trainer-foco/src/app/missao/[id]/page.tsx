import Link from "next/link";
import { notFound } from "next/navigation";
import { levelByN, missionById, nextMissionAfter } from "@/content";
import { examplesForMission } from "@/content/examples";
import { relativeDay } from "@/domain/dates";
import { MIN_REPS_FOR_MASTERY, masteryBlockers, missionStatus } from "@/domain/progression";
import { todayISO } from "@/domain/dates";
import { loadMissionProgress } from "@/server/queries";
import { currentPrefs } from "@/server/session";
import { Breadcrumbs, Callout, Disclosure, Pill, STATUS_LABEL } from "@/components/ui";
import { Checklist, MasteryButton, RepButton, Reveal, SprintTimer } from "@/components/interactive";

export const dynamic = "force-dynamic";

/**
 * 6 etapas, uma por ecrã. Memória de trabalho ≈ 4 elementos (Cowan, 2001): cada etapa
 * mostra UM tipo de tarefa. O URL (?etapa=N) permite retomar exatamente onde parou.
 */
const STAGES = [
  { n: 1, name: "Objetivo", hint: "O que vai conseguir fazer" },
  { n: 2, name: "Conceito", hint: "O mínimo de teoria" },
  { n: 3, name: "Passos", hint: "Fazer no PHC de treino" },
  { n: 4, name: "Provas", hint: "Evidência de que fez" },
  { n: 5, name: "Perguntas", hint: "Pensar antes de ver" },
  { n: 6, name: "Fixar", hint: "Repetir noutro dia" },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const m = missionById((await params).id);
  return { title: m ? m.title : "Missão" };
}

export default async function MissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ etapa?: string }>;
}) {
  const { id } = await params;
  const mission = missionById(id);
  if (!mission) notFound();
  const sp = await searchParams;
  const stage = Math.min(6, Math.max(1, Number(sp.etapa) || 1));
  const [p, prefs] = await Promise.all([loadMissionProgress(id), currentPrefs()]);
  const today = todayISO();
  const level = levelByN(mission.level)!;
  const status = STATUS_LABEL[missionStatus(p, today)];
  const current = STAGES[stage - 1];
  const href = (n: number) => `/missao/${id}?etapa=${n}`;
  const examples = examplesForMission(id);

  return (
    <div>
      {!prefs.focus && (
        <Breadcrumbs
          items={[
            { href: "/", label: "Hoje" },
            { href: `/trilha/${level.n}`, label: `Nível ${level.n} · ${level.name}` },
            { label: mission.id },
          ]}
        />
      )}

      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Pill tone={status.tone}>{status.text}</Pill>
          <span className="text-ink-soft">⏱ {mission.minutes} min no total · pode parar em qualquer etapa</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{mission.title}</h1>
      </header>

      {/* Indicador de etapas: onde estou, quanto falta */}
      <nav aria-label="Etapas da missão" className="mb-6">
        <p className="mb-2 text-sm font-semibold">
          Etapa {stage} de 6 · <span className="text-accent">{current.name}</span>
          <span className="font-normal text-ink-soft"> — {current.hint}</span>
        </p>
        <ol className="grid grid-cols-6 gap-1.5">
          {STAGES.map((s) => (
            <li key={s.n}>
              <Link
                href={href(s.n)}
                aria-label={`Etapa ${s.n}: ${s.name}`}
                aria-current={s.n === stage ? "step" : undefined}
                className={`block h-2.5 rounded-full ${s.n < stage ? "bg-ok" : s.n === stage ? "bg-accent" : "bg-surface-2"}`}
              />
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby="etapa-titulo" className="space-y-5">
        <h2 id="etapa-titulo" className="sr-only">
          {current.name}
        </h2>

        {stage === 1 && (
          <>
            <div className="card p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">No fim desta missão consegue</p>
              <p className="reading mt-1 text-xl font-semibold leading-snug">{mission.goal}</p>
            </div>
            <ul className="reading space-y-2 text-ink-soft">
              <li>📋 {mission.steps.length} passos práticos · 📎 {mission.proofs.length} provas · ❓ {mission.questions.length} perguntas</li>
              {mission.prerequisites.length > 0 && (
                <li>
                  🔗 Ajuda ter feito:{" "}
                  {mission.prerequisites.map((pid, i) => (
                    <span key={pid}>
                      {i > 0 && ", "}
                      <Link className="link" href={`/missao/${pid}`}>
                        {missionById(pid)?.title ?? pid}
                      </Link>
                    </span>
                  ))}
                </li>
              )}
              <li>📖 No guia: {mission.guideRef}</li>
            </ul>
            <SprintTimer />
          </>
        )}

        {stage === 2 && (
          <>
            <div className="card p-5">
              <ul className="reading space-y-3">
                {mission.theory.sentences.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            {mission.theory.terms.length > 0 && (
              <div>
                <h3 className="mb-2 font-bold">Termos-chave ({mission.theory.terms.length}) — abra só os que não conhece</h3>
                <div className="space-y-2">
                  {mission.theory.terms.map((t) => (
                    <Disclosure key={t.term} summary={t.term}>
                      <p className="reading">{t.def}</p>
                    </Disclosure>
                  ))}
                </div>
              </div>
            )}
            {examples.length > 0 && (
              <Callout title="Ver isto aplicado em código">
                <ul className="space-y-1">
                  {examples.map((e) => (
                    <li key={e.slug}>
                      <Link className="link" href={`/exemplos/${e.slug}`}>
                        {e.title}
                      </Link>{" "}
                      <span className="text-sm text-ink-soft">({e.minutes} min)</span>
                    </li>
                  ))}
                </ul>
              </Callout>
            )}
          </>
        )}

        {stage === 3 && (
          <>
            <Callout tone="warn" title="Sempre no ambiente de treino">
              Nunca faça estes passos na base de dados real de um cliente.
            </Callout>
            <Checklist missionId={id} kind="steps" items={mission.steps} done={p?.steps ?? []} />
          </>
        )}

        {stage === 4 && (
          <>
            <p className="reading text-ink-soft">
              Guarde cada prova (print, ficheiro, nota) na pasta <code className="rounded bg-surface-2 px-1">C:\PHC-Treino\evidencias</code> e marque aqui.
              A prova evita a ilusão de que &ldquo;já sei&rdquo;.
            </p>
            <Checklist missionId={id} kind="proofs" items={mission.proofs.map((x) => x.text)} done={p?.proofs ?? []} />
            {mission.links.length > 0 && (
              <Disclosure summary={`Recursos oficiais (${mission.links.length})`}>
                <ul className="space-y-2">
                  {mission.links.map((l) => (
                    <li key={l.url}>
                      <a className="link" href={l.url} target="_blank" rel="noreferrer noopener">
                        {l.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )}
          </>
        )}

        {stage === 5 && (
          <>
            <p className="reading text-ink-soft">Responda de cabeça (ou em voz alta) antes de abrir. Tentar lembrar é o que fortalece a memória.</p>
            <div className="space-y-3">
              {mission.questions.map((q, i) => (
                <Reveal key={i} index={i} question={q.q} answer={q.a} />
              ))}
            </div>
            {mission.theory.pitfalls.length > 0 && (
              <Callout tone="bad" title="Erros comuns a evitar">
                <ul className="list-disc space-y-1 pl-5">
                  {mission.theory.pitfalls.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </Callout>
            )}
          </>
        )}

        {stage === 6 && (
          <>
            <div className="card space-y-3 p-5">
              <p className="reading">
                <strong>Repetir = refazer a missão de memória</strong>, sem olhar para os passos, em cerca de <strong>{mission.repTime}</strong>. Só conta uma
                repetição por intervalo: 1, 2, 4, 7… dias.
              </p>
              <p className="text-sm text-ink-soft">
                Repetições: <strong className="text-ink">{p?.reps ?? 0}</strong>
                {p?.due && (
                  <>
                    {" "}
                    · próxima {relativeDay(p.due, today)} ({p.due})
                  </>
                )}
              </p>
              <RepButton missionId={id} />
            </div>

            <div className="card space-y-3 p-5">
              <h3 className="font-bold">Domínio</h3>
              {p?.mastered ? (
                <Callout tone="ok">Missão dominada ✓ — tem provas e repetições espaçadas.</Callout>
              ) : (
                <>
                  <p className="text-ink-soft">Precisa de todas as provas e {MIN_REPS_FOR_MASTERY} repetições em dias diferentes.</p>
                  {masteryBlockers(mission, p).length > 0 && (
                    <ul className="space-y-1">
                      {masteryBlockers(mission, p).map((b) => (
                        <li key={b} className="flex gap-2">
                          <span aria-hidden>○</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <MasteryButton missionId={id} enabled={masteryBlockers(mission, p).length === 0} />
                </>
              )}
            </div>
          </>
        )}
      </section>

      {/* Navegação entre etapas: botões grandes, sempre no mesmo sítio */}
      <nav aria-label="Navegar entre etapas" className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
        {stage > 1 ? (
          <Link href={href(stage - 1)} className="btn btn-secondary">
            ← {STAGES[stage - 2].name}
          </Link>
        ) : (
          <span />
        )}
        {stage < 6 ? (
          <Link href={href(stage + 1)} className="btn btn-primary">
            Seguinte: {STAGES[stage].name} →
          </Link>
        ) : (
          (() => {
            const nx = nextMissionAfter(id);
            return nx ? (
              <Link href="/" className="btn btn-primary">
                Voltar a Hoje →
              </Link>
            ) : null;
          })()
        )}
      </nav>
    </div>
  );
}
