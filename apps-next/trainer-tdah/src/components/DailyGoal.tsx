/**
 * Meta diária em pontos (não em XP abstrato): progresso visível, pequeno e alcançável.
 * Micro-recompensas frequentes ajudam a sustentar a motivação no TDAH, onde a
 * sensibilidade a recompensas adiadas é menor (Sonuga-Barke, 2003 — "delay aversion").
 */
export function DailyGoal({ done, goal }: { done: number; goal: number }) {
  const reached = done >= goal;
  return (
    <div className="flex flex-wrap items-center gap-4" role="status" aria-live="polite">
      <div className="flex gap-2" aria-hidden>
        {Array.from({ length: goal }, (_, i) => (
          <span
            key={i}
            className={`h-6 w-6 rounded-full border-2 ${i < done ? "border-success bg-success" : "border-line bg-surface"}`}
          />
        ))}
      </div>
      <p className="font-semibold">
        {reached ? (
          <>Meta de hoje cumprida ({done}/{goal}). Tudo o resto é bónus.</>
        ) : (
          <>
            {done}/{goal} micro-ações hoje · faltam {goal - done}
          </>
        )}
      </p>
    </div>
  );
}

/** Últimos 7 dias: "dias ativos" em vez de sequência — falhar um dia não apaga nada. */
export function WeekDots({ days }: { days: { day: string; label: string; n: number }[] }) {
  const active = days.filter((d) => d.n > 0).length;
  return (
    <div>
      <p className="mb-2 text-muted">
        Ativo em <b className="text-fg">{active} de 7</b> dias
      </p>
      <ol className="flex gap-2">
        {days.map((d) => (
          <li key={d.day} className="flex flex-col items-center gap-1 text-sm text-muted">
            <span
              className={`grid h-9 w-9 place-items-center rounded-lg border-2 text-sm font-bold ${
                d.n > 0 ? "border-success bg-success-soft text-success" : "border-line bg-surface"
              }`}
              title={`${d.day}: ${d.n} ações`}
            >
              {d.n > 0 ? "✓" : ""}
            </span>
            {d.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
