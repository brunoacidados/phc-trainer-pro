"use client";
/**
 * Componentes interativos pequenos. Todos dão feedback IMEDIATO (otimista) e
 * anunciam mudanças a leitores de ecrã (aria-live). Erros nunca são silenciosos.
 */
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markExampleStudied, markMastered, recordRepetition, toggleChecklistItem, type ActionResult } from "@/server/actions";

export function Checklist({
  missionId,
  kind,
  items,
  done,
}: {
  missionId: string;
  kind: "steps" | "proofs";
  items: string[];
  done: number[];
}) {
  const [optimistic, setOptimistic] = useOptimistic(new Set(done), (state: Set<number>, action: { i: number; on: boolean }) => {
    const next = new Set(state);
    if (action.on) next.add(action.i);
    else next.delete(action.i);
    return next;
  });
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const count = optimistic.size;

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-ink-soft" aria-live="polite">
        {count} de {items.length} {kind === "steps" ? "passos feitos" : "provas confirmadas"}
        {count === items.length && items.length > 0 ? " — completo ✓" : ""}
      </p>
      <ol className="space-y-2">
        {items.map((text, i) => {
          const on = optimistic.has(i);
          return (
            <li key={i}>
              <label
                className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${
                  on ? "border-ok bg-ok-soft" : "border-line bg-surface hover:border-accent"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--ok)]"
                  checked={on}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setError(null);
                    start(async () => {
                      setOptimistic({ i, on: next });
                      const r = await toggleChecklistItem(missionId, kind, i, next);
                      if (!r.ok) setError(r.message);
                    });
                  }}
                />
                <span className="flex-1">
                  <span className="mr-2 text-sm font-bold text-ink-soft">{i + 1}.</span>
                  <span className={on ? "text-ink-soft line-through decoration-1" : ""}>{text}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ol>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-bad-soft p-3 text-bad">
          Não foi possível guardar: {error}
        </p>
      )}
    </div>
  );
}

/** Pergunta de recuperação ativa: primeiro pensar, depois ver (testing effect — Roediger & Karpicke, 2006). */
export function Reveal({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-4">
      <p className="font-semibold">
        <span className="mr-2 text-ink-soft">P{index + 1}.</span>
        {question}
      </p>
      {open ? (
        <div className="pop mt-3 rounded-lg bg-surface-2 p-3" aria-live="polite">
          <p className="text-sm font-bold text-ok">Resposta</p>
          <p>{answer}</p>
        </div>
      ) : (
        <button className="btn btn-secondary mt-3" onClick={() => setOpen(true)}>
          Já pensei — mostrar resposta
        </button>
      )}
    </div>
  );
}

function useActionMessage() {
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      try {
        const r = await fn();
        setMsg(r);
        router.refresh();
      } catch {
        setMsg({ ok: false, message: "Falhou a ligação. Nada se perdeu — tente outra vez." });
      }
    });
  return { msg, pending, run };
}

function Feedback({ msg }: { msg: ActionResult | null }) {
  if (!msg?.message) return <div aria-live="polite" />;
  return (
    <p aria-live="polite" role={msg.ok ? "status" : "alert"} className={`pop mt-3 rounded-lg p-3 ${msg.ok ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}>
      {msg.message}
    </p>
  );
}

export function RepButton({ missionId }: { missionId: string }) {
  const { msg, pending, run } = useActionMessage();
  return (
    <div>
      <button className="btn btn-primary w-full sm:w-auto" disabled={pending} onClick={() => run(() => recordRepetition(missionId))}>
        {pending ? "A guardar…" : "✅ Fiz a missão de memória — registar repetição"}
      </button>
      <Feedback msg={msg} />
    </div>
  );
}

export function MasteryButton({ missionId, enabled }: { missionId: string; enabled: boolean }) {
  const { msg, pending, run } = useActionMessage();
  return (
    <div>
      <button className="btn btn-secondary w-full sm:w-auto" disabled={pending || !enabled} onClick={() => run(() => markMastered(missionId))}>
        🏅 Declarar domínio
      </button>
      <Feedback msg={msg} />
    </div>
  );
}

export function StudiedButton({ slug }: { slug: string }) {
  const { msg, pending, run } = useActionMessage();
  return (
    <div>
      <button className="btn btn-primary" disabled={pending || !!msg?.ok} onClick={() => run(() => markExampleStudied(slug))}>
        {msg?.ok ? "Estudado ✓" : "Marcar como estudado"}
      </button>
      <Feedback msg={msg} />
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="rounded-md border border-white/25 px-2.5 py-1 text-xs font-semibold text-code-ink hover:bg-white/10"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard indisponível (http): o utilizador pode selecionar manualmente */
        }
      }}
      aria-live="polite"
    >
      {copied ? "Copiado ✓" : "Copiar"}
    </button>
  );
}

/**
 * Sprint de foco: torna o tempo VISÍVEL (a "cegueira temporal" é um traço comum no TDAH — Barkley, 1997).
 * Sem som, sem pressão: quando acaba, sugere pausa. Totalmente opcional.
 */
export function SprintTimer() {
  const [total, setTotal] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  // derivado (não é estado): o relógio para sozinho quando chega a zero
  const active = running && left > 0;
  useEffect(() => {
    if (!active) return;
    ref.current = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [active]);

  if (total === null)
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-soft">Sprint de foco (opcional):</span>
        {[10, 15, 25].map((m) => (
          <button
            key={m}
            className="btn btn-secondary !min-h-10 !px-3 !py-1 text-sm"
            onClick={() => {
              setTotal(m * 60);
              setLeft(m * 60);
              setRunning(true);
            }}
          >
            {m} min
          </button>
        ))}
      </div>
    );

  const pct = total ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-lg font-bold tabular-nums" aria-live="off">
          {mm}:{ss}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        {left > 0 && (
          <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => setRunning((r) => !r)}>
            {active ? "Pausa" : "Retomar"}
          </button>
        )}
        <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => setTotal(null)}>
          Parar
        </button>
      </div>
      {left === 0 && (
        <p className="mt-2 text-sm font-semibold text-ok" role="status">
          Sprint concluído. Levante-se, beba água, 5 minutos de pausa. 🌿
        </p>
      )}
    </div>
  );
}
