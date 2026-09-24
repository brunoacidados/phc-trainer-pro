"use client";
import { useMemo, useState } from "react";
import type { GlossaryEntry } from "@/content/types";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function GlossarySearch({ entries }: { entries: GlossaryEntry[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => [...new Set(entries.map((e) => e.tag))].sort(), [entries]);
  const list = useMemo(() => {
    const n = norm(q.trim());
    return entries.filter((e) => (!tag || e.tag === tag) && (!n || norm(e.term + " " + e.def).includes(n)));
  }, [entries, q, tag]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Pesquisar no glossário</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar (ex.: ATCUD, stamp, SAF-T)"
          className="min-h-12 w-full rounded-xl border-2 border-line bg-surface px-4 text-ink placeholder:text-ink-soft focus:border-accent"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tema">
        {[null, ...tags].map((t) => (
          <button
            key={t ?? "todos"}
            onClick={() => setTag(t)}
            aria-pressed={tag === t}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${tag === t ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-soft hover:bg-surface-2"}`}
          >
            {t ?? "Todos"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft" aria-live="polite">
        {list.length} {list.length === 1 ? "termo" : "termos"}
      </p>
      <ul className="mt-2 space-y-2">
        {list.map((e) => (
          <li key={e.term}>
            <details className="card">
              <summary className="flex min-h-12 items-center gap-3 px-4 py-3">
                <span aria-hidden className="chev inline-block text-ink-soft">
                  ›
                </span>
                <span className="flex-1 font-semibold">{e.term}</span>
                <span className="text-xs text-ink-soft">{e.tag}</span>
              </summary>
              <div className="reading border-t border-line px-4 py-3">
                <p>{e.def}</p>
                {e.extra && <p className="mt-2 text-ink-soft">{e.extra}</p>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
