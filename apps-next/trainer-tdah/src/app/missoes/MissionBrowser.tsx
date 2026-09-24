"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface MissionRow {
  id: string;
  title: string;
  min: number;
  status: "nova" | "em-curso" | "rever" | "praticada" | "dominada";
  accessible: boolean;
  recommended: boolean;
}

export interface LevelGroup {
  level: number;
  name: string;
  desc: string;
  open: boolean;
  missingToOpen: number;
  mastered: number;
  practiced: number;
  missions: MissionRow[];
}

const STATUS: Record<MissionRow["status"], { label: string; cls: string }> = {
  nova: { label: "Nova", cls: "bg-surface-2 text-fg" },
  "em-curso": { label: "Em curso", cls: "bg-primary-soft text-primary" },
  rever: { label: "Rever hoje", cls: "bg-warn-soft text-warn" },
  praticada: { label: "Praticada", cls: "bg-success-soft text-success" },
  dominada: { label: "Dominada ✓", cls: "bg-success text-bg" },
};

type Filter = "todas" | "em-curso" | "rever";

export function MissionBrowser({ groups, currentLevel }: { groups: LevelGroup[]; currentLevel: number }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        missions: g.missions.filter((m) => {
          if (filter === "em-curso" && m.status !== "em-curso") return false;
          if (filter === "rever" && m.status !== "rever") return false;
          if (needle && !`${m.id} ${m.title}`.toLowerCase().includes(needle)) return false;
          return true;
        }),
      }))
      .filter((g) => g.missions.length > 0);
  }, [groups, q, filter]);

  const searching = q.trim() !== "" || filter !== "todas";

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">Procurar missão</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar (ex.: fatura, SAF-T, L14)"
            className="min-h-12 w-full rounded-xl border-2 border-line bg-surface px-4 focus:border-primary"
          />
        </label>
        <div role="group" aria-label="Filtro" className="flex gap-2">
          {(
            [
              ["todas", "Todas"],
              ["em-curso", "Em curso"],
              ["rever", "Para rever"],
            ] as [Filter, string][]
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
              className={`min-h-12 rounded-xl border-2 px-3 font-semibold ${filter === v ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-line p-6 text-center text-muted">Nada encontrado. Tente outra palavra ou o filtro &quot;Todas&quot;.</p>
      )}

      <div className="space-y-3">
        {filtered.map((g) => (
          <details key={g.level} open={searching || g.level === currentLevel} className="rounded-2xl border-2 border-line bg-surface">
            <summary className="flex min-h-16 flex-wrap items-center gap-3 px-5 py-3">
              <span className="chev text-muted" aria-hidden>
                ▶
              </span>
              <span className="flex-1">
                <span className="block text-lg font-bold">
                  Nível {g.level} · {g.name}
                </span>
                <span className="text-sm text-muted">
                  {g.open ? `${g.practiced}/${g.missions.length} praticadas · ${g.mastered} dominadas` : `🔒 Abre quando praticar mais ${g.missingToOpen} missão(ões) do nível ${g.level - 1}`}
                </span>
              </span>
              {g.level === currentLevel && <span className="rounded-full bg-primary px-3 py-0.5 text-sm font-bold text-primary-fg">Está aqui</span>}
            </summary>
            <ul className="divide-y-2 divide-line border-t-2 border-line">
              {g.missions.map((m) => {
                const s = STATUS[m.status];
                const inner = (
                  <>
                    <span className="w-14 shrink-0 font-mono text-sm text-muted">{m.id}</span>
                    <span className="flex-1 font-semibold">
                      {m.title}
                      {m.recommended && <span className="ml-2 rounded-full border-2 border-primary px-2 text-sm text-primary">Recomendada</span>}
                    </span>
                    <span className="hidden text-sm text-muted sm:inline">≈{m.min} min</span>
                    <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${s.cls}`}>{s.label}</span>
                  </>
                );
                return (
                  <li key={m.id}>
                    {m.accessible ? (
                      <Link href={`/missoes/${m.id}`} className="flex min-h-14 flex-wrap items-center gap-3 px-5 py-3 hover:bg-surface-2">
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex min-h-14 flex-wrap items-center gap-3 px-5 py-3 opacity-60" aria-disabled>
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
