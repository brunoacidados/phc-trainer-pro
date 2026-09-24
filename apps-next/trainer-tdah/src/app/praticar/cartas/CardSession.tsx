"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, ProgressBar } from "@/components/ui";
import type { Rating } from "@/domain/srs";
import { finishCardSession, rateCard } from "@/server/actions";

interface SessionCard {
  key: string;
  front: string;
  back: string;
  level: string;
  isNew: boolean;
}

/**
 * Sessão de cartas:
 * - uma carta no ecrã, nada mais
 * - "Errei" repõe a carta no fim da fila desta sessão (reaprendizagem imediata)
 * - atalhos: Espaço = mostrar, 1/2/3 = avaliar
 */
export function CardSession({ cards }: { cards: SessionCard[] }) {
  const [queue, setQueue] = useState(cards);
  const [shown, setShown] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const total = cards.length;
  const card = queue[0];

  const rate = useCallback(
    async (r: Rating) => {
      if (!card || busy) return;
      setBusy(true);
      setErr(null);
      try {
        const res = await rateCard(card.key, r);
        if (!res.ok) {
          setErr(res.error);
          return;
        }
        setShown(false);
        setQueue((q) => (r === 0 ? [...q.slice(1), q[0]] : q.slice(1)));
        if (r !== 0) setDoneCount((n) => n + 1);
        if (r !== 0 && queue.length === 1) await finishCardSession();
      } catch {
        setErr("Sem ligação — a avaliação não foi guardada. Tente de novo.");
      } finally {
        setBusy(false);
      }
    },
    [card, busy, queue.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.key === " " && !shown) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3"].includes(e.key)) {
        void rate((Number(e.key) - 1) as Rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, shown, rate]);

  if (total === 0) {
    return (
      <div className="rounded-2xl border-2 border-line bg-surface p-8 text-center">
        <p className="text-2xl font-bold">Não há cartas para hoje ✓</p>
        <p className="mt-2 text-muted">A memória também precisa de pausas. Volte amanhã.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-primary underline underline-offset-4">
          Voltar a Hoje
        </Link>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="pop rounded-2xl border-2 border-success bg-success-soft p-8 text-center">
        <p className="text-3xl font-bold text-success">Sessão terminada!</p>
        <p className="mt-2 text-lg">{total} cartas revistas. As próximas revisões já estão agendadas.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg">
            Voltar a Hoje
          </Link>
          <Link href="/praticar/cartas" className="inline-flex min-h-12 items-center rounded-xl border-2 border-line bg-surface px-5 font-semibold">
            Mais uma sessão
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar value={doneCount} max={total} label="Cartas desta sessão" />
      <div key={card.key + String(shown)} className="pop mt-6 rounded-2xl border-2 border-primary bg-surface p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">
          {card.level}
          {card.isNew && <span className="ml-2 rounded-full bg-primary-soft px-2 text-primary">nova</span>}
        </p>
        <h1 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">{card.front}</h1>
        {shown ? (
          <>
            <hr className="my-5 border-t-2 border-line" />
            <p className="prose-limit text-lg leading-relaxed">{card.back}</p>
          </>
        ) : (
          <p className="mt-4 text-muted">Pense na resposta antes de a ver.</p>
        )}
      </div>

      <div aria-live="polite">{err && <p className="mt-3 rounded-xl bg-danger-soft p-3 font-semibold text-danger">{err}</p>}</div>

      <div className="mt-5">
        {!shown ? (
          <Button variant="primary" size="lg" className="w-full" onClick={() => setShown(true)}>
            Mostrar resposta <kbd className="ml-2 rounded border border-primary-fg/40 px-1 text-sm">Espaço</kbd>
          </Button>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="danger" size="lg" disabled={busy} onClick={() => rate(0)}>
              Errei <kbd className="text-sm opacity-70">1</kbd>
            </Button>
            <Button size="lg" disabled={busy} onClick={() => rate(1)}>
              Quase <kbd className="text-sm opacity-70">2</kbd>
            </Button>
            <Button variant="success" size="lg" disabled={busy} onClick={() => rate(2)}>
              Sabia <kbd className="text-sm opacity-70">3</kbd>
            </Button>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-muted">&quot;Errei&quot; volta a aparecer no fim desta sessão — é assim que se aprende.</p>
    </div>
  );
}
