"use client";

import { useMemo, useState } from "react";
import type { GlossaryTerm } from "@/content/types";

export function GlossaryBrowser({ terms }: { terms: GlossaryTerm[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => Array.from(new Set(terms.map((t) => t.tag).filter(Boolean))) as string[], [terms]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return terms.filter((t) => (!tag || t.tag === tag) && (!n || `${t.t} ${t.d}`.toLowerCase().includes(n)));
  }, [terms, q, tag]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Procurar termo (ex.: ATCUD, stamp, PCMP)"
        aria-label="Procurar termo"
        className="min-h-12 w-full rounded-xl border-2 border-line bg-surface px-4 focus:border-primary"
      />
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Categoria">
        <button type="button" aria-pressed={tag === null} onClick={() => setTag(null)} className={`min-h-10 rounded-full border-2 px-3 text-sm font-semibold ${tag === null ? "border-primary bg-primary-soft text-primary" : "border-line"}`}>
          Todas
        </button>
        {tags.map((t) => (
          <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(t)} className={`min-h-10 rounded-full border-2 px-3 text-sm font-semibold ${tag === t ? "border-primary bg-primary-soft text-primary" : "border-line"}`}>
            {t}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {list.length} termo(s)
      </p>
      <ul className="mt-2 space-y-2">
        {list.map((t) => (
          <li key={t.t}>
            <details className="rounded-xl border-2 border-line bg-surface">
              <summary className="flex min-h-14 items-center gap-3 px-4 py-2 font-semibold">
                <span className="chev text-muted" aria-hidden>
                  ▶
                </span>
                {t.t}
              </summary>
              <div className="prose-limit border-t-2 border-line px-4 py-3">
                <p>{t.d}</p>
                {t.pratica && <p className="mt-2 rounded-lg bg-primary-soft p-3"><b>Na prática:</b> {t.pratica}</p>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
