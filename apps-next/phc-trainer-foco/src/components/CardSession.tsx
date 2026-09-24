"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { rateCardAction } from "@/server/actions";
import { NEW_CARD, reviewCard, type CardState, type Rating } from "@/domain/srs";
import { relativeDay } from "@/domain/dates";

export interface SessionCard {
  id: string;
  front: string;
  back: string;
  level: number;
  state: CardState | null;
}

const RATINGS: { r: Rating; label: string; key: string; cls: string }[] = [
  { r: 0, label: "Não sabia", key: "1", cls: "border-bad text-bad hover:bg-bad-soft" },
  { r: 1, label: "Com esforço", key: "2", cls: "border-warn text-warn hover:bg-warn-soft" },
  { r: 2, label: "Sabia", key: "3", cls: "border-ok text-ok hover:bg-ok-soft" },
];

/**
 * Sessão com FIM à vista (máx. 10). Uma carta por ecrã. Cada botão mostra quando a carta volta
 * → o sistema é previsível, não uma caixa negra. Atalhos: Espaço = mostrar, 1/2/3 = avaliar.
 */
export function CardSession({ cards, today }: { cards: SessionCard[]; today: string }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [tally, setTally] = useState<[number, number, number]>([0, 0, 0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const card = cards[i];

  function rate(r: Rating) {
    if (!card || pending) return;
    setError(null);
    start(async () => {
      try {
        const res = await rateCardAction(card.id, r);
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setTally((t) => {
          const n = [...t] as [number, number, number];
          n[r]++;
          return n;
        });
        setShown(false);
        setI((x) => x + 1);
      } catch {
        setError("Falhou a ligação. A carta não foi avaliada — tente outra vez.");
      }
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "BUTTON", "A"].includes(e.target.tagName) && e.key === " ") return;
      if (!shown && e.key === " ") {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3"].includes(e.key)) rate((Number(e.key) - 1) as Rating);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!cards.length)
    return (
      <div className="card p-6 text-center">
        <p className="text-xl font-bold">Não há cartas para hoje. 🌿</p>
        <p className="mt-2 text-ink-soft">As próximas aparecem quando chegar a data delas.</p>
        <Link href="/" className="btn btn-primary mt-4">
          Voltar a Hoje
        </Link>
      </div>
    );

  if (!card)
    return (
      <div className="card pop p-6 text-center" role="status">
        <p className="text-4xl" aria-hidden>
          ✓
        </p>
        <p className="mt-2 text-2xl font-bold">Sessão concluída</p>
        <p className="mt-2 text-ink-soft">
          {cards.length} cartas: {tally[2]} sabia · {tally[1]} com esforço · {tally[0]} para rever amanhã.
        </p>
        <p className="reading mx-auto mt-2 text-sm text-ink-soft">Errar faz parte: as cartas falhadas voltam amanhã, sem penalização.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Voltar a Hoje
          </Link>
          <Link href="/praticar/cartas" className="btn btn-secondary">
            Mais 10 cartas
          </Link>
        </div>
      </div>
    );

  const prev = card.state ?? NEW_CARD;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-ink-soft">
        <span>
          Carta <strong className="text-ink">{i + 1}</strong> de {cards.length}
        </span>
        <span>
          Nível {card.level}
          {card.state ? "" : " · nova"}
        </span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-accent" style={{ width: `${(i / cards.length) * 100}%` }} />
      </div>

      <div className="card min-h-64 p-6" aria-live="polite">
        <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">Pergunta</p>
        <p className="mt-2 text-2xl font-semibold leading-snug">{card.front}</p>
        {shown && (
          <div className="pop mt-6 border-t border-line pt-5">
            <p className="text-sm font-bold uppercase tracking-wide text-ok">Resposta</p>
            <p className="reading mt-2 text-lg">{card.back}</p>
          </div>
        )}
      </div>

      <div className="mt-5">
        {!shown ? (
          <button className="btn btn-primary w-full text-lg" onClick={() => setShown(true)} autoFocus>
            Mostrar resposta <kbd className="ml-2 rounded bg-white/20 px-1.5 text-xs">Espaço</kbd>
          </button>
        ) : (
          <>
            <p className="mb-2 text-center text-sm text-ink-soft">Seja honesto — é só para si.</p>
            <div className="grid grid-cols-3 gap-2">
              {RATINGS.map((x) => {
                const due = reviewCard(prev, x.r, today).due!;
                return (
                  <button key={x.r} disabled={pending} onClick={() => rate(x.r)} className={`btn flex-col !gap-0 border-2 bg-surface ${x.cls}`}>
                    <span>{x.label}</span>
                    <span className="text-xs font-normal">volta {relativeDay(due, today)}</span>
                    <kbd className="mt-0.5 text-[10px] opacity-70">{x.key}</kbd>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-bad-soft p-3 text-bad">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
