"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { CodeExample, Lab, MissionTheory } from "@/content/types";
import { ExampleView } from "@/components/ExampleView";
import { Button, Disclosure, ProgressBar } from "@/components/ui";
import { canMarkMastered, type Rating } from "@/domain/srs";
import { markMissionMastered, registerMissionRep, saveMissionNotes, toggleMissionItem } from "@/server/actions";

type Phase = 0 | 1 | 2 | 3;

interface Props {
  lab: Lab;
  theory: MissionTheory | null;
  examples: CodeExample[];
  prereqs: { id: string; title: string; done: boolean }[];
  initial: { steps: number[]; proofs: number[]; notes: string; box: number; reps: number; mastered: boolean };
}

const PROOF_KIND: Record<string, string> = { print: "Captura de ecrã", file: "Ficheiro", nota: "Nota escrita" };

/** Divide um parágrafo longo em frases → blocos curtos (chunking). */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"'(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function MissionRunner({ lab, theory, examples, prereqs, initial }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initial.steps.length > 0 || initial.proofs.length > 0 ? 1 : 0);
  const [steps, setSteps] = useState<number[]>(initial.steps);
  const [proofs, setProofs] = useState<number[]>(initial.proofs);
  const [status, setStatus] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const [pending, start] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const goto = (p: Phase) => {
    setPhase(p);
    setStatus(null);
    topRef.current?.scrollIntoView({ block: "start" });
  };

  const flash = (tone: "ok" | "err", msg: string) => setStatus({ tone, msg });

  /** Atualização otimista: muda já no ecrã, reverte se o servidor falhar. */
  function toggle(kind: "steps" | "proofs", i: number) {
    const [list, set] = kind === "steps" ? [steps, setSteps] : [proofs, setProofs];
    const prev = list;
    const next = list.includes(i) ? list.filter((x) => x !== i) : [...list, i];
    set(next);
    start(async () => {
      try {
        const r = await toggleMissionItem(lab.id, kind, i);
        if (!r.ok) {
          set(prev);
          flash("err", r.error);
        } else flash("ok", "Guardado ✓");
      } catch {
        set(prev);
        flash("err", "Sem ligação — não foi guardado. Tente de novo.");
      }
    });
  }

  const phases = [
    { label: "Entender", done: phase > 0 },
    { label: "Fazer", done: steps.length >= lab.steps.length, count: `${steps.length}/${lab.steps.length}` },
    { label: "Provar", done: proofs.length >= lab.proofs.length, count: `${proofs.length}/${lab.proofs.length}` },
    { label: "Verificar", done: false },
  ];

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Stepper: 4 fases fixas, sempre visíveis → sabe onde está e quanto falta */}
      <nav aria-label="Fases da missão" className="mb-6">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {phases.map((p, i) => (
            <li key={p.label}>
              <button
                type="button"
                onClick={() => goto(i as Phase)}
                aria-current={phase === i ? "step" : undefined}
                className={`flex min-h-14 w-full items-center gap-2 rounded-xl border-2 px-3 text-left font-semibold ${
                  phase === i ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface hover:border-primary"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${p.done ? "bg-success text-bg" : phase === i ? "bg-primary text-primary-fg" : "bg-surface-2"}`}
                  aria-hidden
                >
                  {p.done ? "✓" : i + 1}
                </span>
                <span className="flex-1">
                  {p.label}
                  {p.count && <span className="block text-sm font-normal text-muted">{p.count}</span>}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div aria-live="polite" className="min-h-8">
        {status && (
          <p className={`mb-3 inline-block rounded-lg px-3 py-1 text-sm font-semibold ${status.tone === "ok" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
            {status.msg}
          </p>
        )}
      </div>

      {phase === 0 && <Understand lab={lab} theory={theory} examples={examples} prereqs={prereqs} onNext={() => goto(1)} />}
      {phase === 1 && <DoSteps lab={lab} done={steps} onToggle={(i) => toggle("steps", i)} pending={pending} onNext={() => goto(2)} />}
      {phase === 2 && (
        <Prove lab={lab} done={proofs} onToggle={(i) => toggle("proofs", i)} initialNotes={initial.notes} onNext={() => goto(3)} onStatus={flash} />
      )}
      {phase === 3 && (
        <Verify
          lab={lab}
          box={initial.box}
          mastered={initial.mastered}
          proofsDone={proofs.length}
          onDone={(msg) => {
            flash("ok", msg);
            router.refresh();
          }}
          onError={(msg) => flash("err", msg)}
        />
      )}
    </div>
  );
}

/* ---------------- Fase 1: Entender ---------------- */

function Understand({
  lab,
  theory,
  examples,
  prereqs,
  onNext,
}: Pick<Props, "lab" | "theory" | "examples" | "prereqs"> & { onNext: () => void }) {
  const chunks = theory ? sentences(theory.c) : [];
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? chunks : chunks.slice(0, 3);
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border-2 border-primary bg-primary-soft p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Objetivo</h2>
        <p className="prose-limit mt-1 text-xl font-semibold">{lab.goal}</p>
      </section>

      {prereqs.some((p) => !p.done) && (
        <p className="rounded-xl bg-warn-soft p-3 text-warn">
          Recomendado antes: {prereqs.filter((p) => !p.done).map((p, i) => (
            <span key={p.id}>
              {i > 0 && ", "}
              <Link className="font-semibold underline" href={`/missoes/${p.id}`}>
                {p.id}
              </Link>
            </span>
          ))}
        </p>
      )}

      {chunks.length > 0 && (
        <section className="rounded-2xl border-2 border-line bg-surface p-5">
          <h2 className="mb-3 text-lg font-bold">A ideia em poucas frases</h2>
          <ul className="prose-limit space-y-3">
            {visible.map((s) => (
              <li key={s} className="border-l-4 border-primary/40 pl-4">
                {s}
              </li>
            ))}
          </ul>
          {chunks.length > 3 && (
            <button type="button" className="mt-3 font-semibold text-primary underline underline-offset-4" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
              {showAll ? "Mostrar menos" : `Ler mais ${chunks.length - 3} frase(s)`}
            </button>
          )}
        </section>
      )}

      {theory && theory.s.length > 0 && (
        <Disclosure title="Conceitos-chave" hint={`${theory.s.length}`}>
          <dl className="prose-limit space-y-3">
            {theory.s.map(([t, d]) => (
              <div key={t}>
                <dt className="font-bold">{t}</dt>
                <dd className="text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      )}

      {examples.length > 0 && (
        <Disclosure title="Exemplo prático de código" hint={`${examples.length}`} defaultOpen>
          <div className="space-y-8">
            {examples.map((ex) => (
              <div key={ex.id}>
                <h3 className="mb-3 text-lg font-bold">{ex.title}</h3>
                <ExampleView ex={ex} />
              </div>
            ))}
          </div>
        </Disclosure>
      )}

      {theory && theory.e.length > 0 && (
        <Disclosure title="Erros comuns a evitar" hint={`${theory.e.length}`}>
          <ul className="prose-limit list-disc space-y-2 pl-5">
            {theory.e.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Disclosure>
      )}

      {lab.links && lab.links.length > 0 && (
        <Disclosure title="Recursos oficiais" hint={`${lab.links.length}`}>
          <ul className="space-y-2">
            {lab.links.map((l) => (
              <li key={l.u}>
                <a href={l.u} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                  {l.t} ↗
                </a>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      <p className="text-sm text-muted">Referência no guia: {lab.ref}</p>
      <Button variant="primary" size="lg" onClick={onNext}>
        Percebi — vamos fazer →
      </Button>
    </div>
  );
}

/* ---------------- Fase 2: Fazer ---------------- */

function DoSteps({ lab, done, onToggle, pending, onNext }: { lab: Lab; done: number[]; onToggle: (i: number) => void; pending: boolean; onNext: () => void }) {
  const firstOpen = lab.steps.findIndex((_, i) => !done.includes(i));
  const [cur, setCur] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [list, setList] = useState(false);
  const allDone = done.length >= lab.steps.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowRight") setCur((c) => Math.min(c + 1, lab.steps.length - 1));
      if (e.key === "ArrowLeft") setCur((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lab.steps.length]);

  const markAndNext = () => {
    if (!done.includes(cur)) onToggle(cur);
    const next = lab.steps.findIndex((_, i) => i > cur && !done.includes(i));
    if (next !== -1) setCur(next);
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={done.length} max={lab.steps.length} label="Passos feitos" tone={allDone ? "success" : "primary"} />
      <div className="flex justify-end">
        <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setList((v) => !v)} aria-pressed={list}>
          {list ? "Ver um passo de cada vez" : "Ver todos os passos"}
        </button>
      </div>

      {list ? (
        <ul className="space-y-2">
          {lab.steps.map((s, i) => (
            <li key={i}>
              <label className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${done.includes(i) ? "border-success bg-success-soft" : "border-line bg-surface"}`}>
                <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[var(--success)]" checked={done.includes(i)} onChange={() => onToggle(i)} />
                <span className={done.includes(i) ? "text-muted line-through decoration-2" : ""}>
                  <b className="mr-1">{i + 1}.</b>
                  {s}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div key={cur} className="pop rounded-2xl border-2 border-primary bg-surface p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            Passo {cur + 1} de {lab.steps.length}
            {done.includes(cur) && <span className="ml-2 text-success">· feito ✓</span>}
          </p>
          <p className="prose-limit mt-3 text-xl leading-relaxed sm:text-2xl">{lab.steps[cur]}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {done.includes(cur) ? (
              <Button onClick={() => onToggle(cur)} disabled={pending}>
                Desmarcar
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={markAndNext} disabled={pending}>
                ✓ Feito{cur < lab.steps.length - 1 ? " — próximo" : ""}
              </Button>
            )}
            <Button onClick={() => setCur((c) => Math.max(0, c - 1))} disabled={cur === 0} aria-label="Passo anterior">
              ← Anterior
            </Button>
            <Button onClick={() => setCur((c) => Math.min(lab.steps.length - 1, c + 1))} disabled={cur === lab.steps.length - 1} aria-label="Passo seguinte">
              Seguinte →
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted">Dica: setas ← → do teclado mudam de passo. Pode parar a qualquer momento — fica guardado.</p>
        </div>
      )}

      {allDone && (
        <div className="pop rounded-2xl bg-success-soft p-5">
          <p className="text-lg font-bold text-success">Todos os passos feitos. Excelente.</p>
          <Button variant="primary" size="lg" className="mt-3" onClick={onNext}>
            Registar as provas →
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Fase 3: Provar ---------------- */

function Prove({
  lab,
  done,
  onToggle,
  initialNotes,
  onNext,
  onStatus,
}: {
  lab: Lab;
  done: number[];
  onToggle: (i: number) => void;
  initialNotes: string;
  onNext: () => void;
  onStatus: (tone: "ok" | "err", msg: string) => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(initialNotes);
  const allDone = done.length >= lab.proofs.length;

  async function save() {
    if (notes === saved) return;
    try {
      const r = await saveMissionNotes(lab.id, notes);
      if (r.ok) {
        setSaved(notes);
        onStatus("ok", "Notas guardadas ✓");
      } else onStatus("err", r.error);
    } catch {
      onStatus("err", "Sem ligação — notas não guardadas.");
    }
  }

  return (
    <div className="space-y-4">
      <p className="prose-limit text-muted">
        Prova = registo objetivo de que fez (captura, ficheiro, nota). Sem prova, o cérebro engana-se com &quot;isso eu sei&quot;. Guarde os ficheiros
        como <code className="rounded bg-surface-2 px-1">{lab.id}\AAAA-MM-DD-descricao.png</code>.
      </p>
      <ul className="space-y-2">
        {lab.proofs.map((p, i) => (
          <li key={i}>
            <label className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${done.includes(i) ? "border-success bg-success-soft" : "border-line bg-surface"}`}>
              <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[var(--success)]" checked={done.includes(i)} onChange={() => onToggle(i)} />
              <span>
                <span className="mr-2 rounded-full bg-surface-2 px-2 py-0.5 text-sm font-semibold">{PROOF_KIND[p.k] ?? p.k}</span>
                {p.d}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div>
        <label htmlFor="notes" className="mb-1 block font-semibold">
          Notas da missão <span className="font-normal text-muted">(opcional — guarda ao sair da caixa)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={save}
          rows={4}
          maxLength={5000}
          className="w-full rounded-xl border-2 border-line bg-surface p-3 focus:border-primary"
          placeholder="O que fiz, o que correu mal, dúvidas para o formador…"
        />
        {notes !== saved && <p className="text-sm text-warn">Alterações por guardar</p>}
      </div>
      <Button variant={allDone ? "primary" : "secondary"} size="lg" onClick={onNext}>
        {allDone ? "Provas completas — verificar →" : "Continuar para verificar →"}
      </Button>
    </div>
  );
}

/* ---------------- Fase 4: Verificar & repetir ---------------- */

function Verify({
  lab,
  box,
  mastered,
  proofsDone,
  onDone,
  onError,
}: {
  lab: Lab;
  box: number;
  mastered: boolean;
  proofsDone: number;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();
  const [registered, setRegistered] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const canMaster = !mastered && canMarkMastered({ proofsDone, proofsTotal: lab.proofs.length, box });

  function rate(r: Rating) {
    start(async () => {
      try {
        const res = await registerMissionRep(lab.id, r);
        if (!res.ok) return onError(res.error);
        setRegistered(true);
        setRunning(false);
        onDone(r === 0 ? "Registado. Volta amanhã — repetir com ajuda também conta." : "Repetição registada ✓ A próxima revisão foi agendada.");
      } catch {
        onError("Sem ligação — não foi registado.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {lab.ask.length > 0 && (
        <section>
          <h2 className="mb-1 text-xl font-bold">Teste-se (sem espreitar)</h2>
          <p className="prose-limit mb-3 text-muted">Responda de cabeça ou em voz alta e só depois veja a resposta. Tentar lembrar é o que fixa a memória.</p>
          <ul className="space-y-3">
            {lab.ask.map((a, i) => (
              <li key={i} className="rounded-2xl border-2 border-line bg-surface p-5">
                <p className="text-lg font-semibold">{a.q}</p>
                {revealed.has(i) ? (
                  <p className="pop prose-limit mt-3 border-l-4 border-success pl-4">{a.a}</p>
                ) : (
                  <Button className="mt-3" onClick={() => setRevealed((s) => new Set(s).add(i))}>
                    Já pensei — mostrar resposta
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border-2 border-primary bg-surface p-5">
        <h2 className="text-xl font-bold">Registar uma repetição completa</h2>
        <p className="prose-limit mt-1 text-muted">Fez a missão do início ao fim? Diga com honestidade como correu — o app agenda a próxima revisão por si.</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-mono text-2xl font-bold" aria-live="off">
            {mm}:{ss}
          </span>
          <Button onClick={() => setRunning((r) => !r)}>{running ? "Pausar" : elapsed ? "Retomar" : "Cronometrar (opcional)"}</Button>
          {elapsed > 0 && !running && <Button onClick={() => setElapsed(0)}>Zerar</Button>}
          <span className="text-sm text-muted">Meta de profissional: {lab.meta}</span>
        </div>

        {registered ? (
          <div className="pop mt-5 rounded-xl bg-success-soft p-4">
            <p className="font-bold text-success">Feito! Uma repetição a mais na memória de longo prazo.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/" className="font-semibold text-primary underline underline-offset-4">
                Voltar a Hoje (próxima ação) →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button variant="danger" size="lg" disabled={pending} onClick={() => rate(0)}>
              Precisei de ajuda
            </Button>
            <Button size="lg" disabled={pending} onClick={() => rate(1)}>
              Consegui com esforço
            </Button>
            <Button variant="success" size="lg" disabled={pending} onClick={() => rate(2)}>
              Fácil / dentro da meta
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border-2 border-line bg-surface p-5">
        <h2 className="text-lg font-bold">Dominar a missão</h2>
        {mastered ? (
          <p className="mt-1 font-semibold text-success">Missão dominada ✓</p>
        ) : (
          <>
            <p className="prose-limit mt-1 text-muted">
              Exige todas as provas ({proofsDone}/{lab.proofs.length}) e pelo menos 2 repetições bem-sucedidas (tem {box}). Ou fica dominada
              automaticamente após 5.
            </p>
            <Button
              className="mt-3"
              variant="success"
              disabled={!canMaster || pending}
              onClick={() =>
                start(async () => {
                  const r = await markMissionMastered(lab.id);
                  if (r.ok) onDone("Missão marcada como dominada ✓");
                  else onError(r.error);
                })
              }
            >
              Marcar como dominada
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
