"use client";
import { useState } from "react";

export function ExampleCheck({ q, options, answer, explain }: { q: string; options: string[]; answer: number; explain: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <fieldset className="card p-5">
      <legend className="sr-only">Verificação</legend>
      <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">Verifique que percebeu</p>
      <p className="mt-1 text-lg font-semibold">{q}</p>
      <div className="mt-3 space-y-2">
        {options.map((o, k) => {
          const done = picked !== null;
          const cls = !done ? "border-line hover:border-accent" : k === answer ? "border-ok bg-ok-soft" : k === picked ? "border-bad bg-bad-soft" : "border-line opacity-70";
          return (
            <button key={k} disabled={done} onClick={() => setPicked(k)} className={`flex min-h-12 w-full items-start gap-3 rounded-xl border-2 p-3 text-left ${cls}`}>
              <span className="font-bold text-ink-soft">{String.fromCharCode(65 + k)}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`pop mt-3 rounded-lg p-3 ${picked === answer ? "bg-ok-soft" : "bg-warn-soft"}`} aria-live="polite">
          <p className="font-bold">{picked === answer ? "Certo." : "Quase — veja porquê:"}</p>
          <p>{explain}</p>
          {picked !== answer && (
            <button className="btn btn-ghost mt-1 !min-h-9 text-sm" onClick={() => setPicked(null)}>
              Tentar outra vez
            </button>
          )}
        </div>
      )}
    </fieldset>
  );
}
