"use client";

import { useState } from "react";
import type { CodeExample } from "@/content/types";

export function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border-2 border-line">
      <div className="flex items-center justify-between bg-surface-2 px-3 py-1 text-sm">
        <span className="font-semibold text-muted">{label}</span>
        <button
          type="button"
          className="min-h-10 rounded-lg px-3 font-semibold hover:bg-bg"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
        >
          <span role="status">{copied ? "Copiado ✓" : "Copiar"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto bg-bg p-4 text-[0.95rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const TABS = [
  { id: "problema", label: "1. Problema" },
  { id: "fragil", label: "2. Versão frágil" },
  { id: "correta", label: "3. Versão correta" },
  { id: "verificar", label: "4. Verificar" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Exemplo resolvido em 4 separadores: só uma coisa no ecrã de cada vez.
 * A ordem (problema → erro → correção → verificação) segue o formato de
 * "exemplo resolvido" com contraste de erros (Große & Renkl, 2007).
 */
export function ExampleView({ ex }: { ex: CodeExample }) {
  const [tab, setTab] = useState<TabId>("problema");
  const lang = ex.language === "sql" ? "SQL (T-SQL)" : "Xbase (VFP)";
  return (
    <div>
      <div role="tablist" aria-label={ex.title} className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-12 rounded-xl border-2 px-3 font-semibold ${tab === t.id ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="space-y-4">
        {tab === "problema" && (
          <>
            <p className="prose-limit text-lg">{ex.problem}</p>
            {ex.caveat && <p className="prose-limit rounded-xl bg-warn-soft p-3 text-warn">⚠ {ex.caveat}</p>}
            <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setTab("fragil")}>
              Ver a versão frágil →
            </button>
          </>
        )}
        {tab === "fragil" && (
          <>
            <CodeBlock code={ex.bad.code} label={`✗ Frágil · ${lang}`} />
            <div className="rounded-xl bg-danger-soft p-4">
              <p className="mb-2 font-bold text-danger">Porque é frágil</p>
              <ul className="prose-limit list-disc space-y-1 pl-5">
                {ex.bad.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
            <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setTab("correta")}>
              Ver a versão correta →
            </button>
          </>
        )}
        {tab === "correta" && (
          <>
            <CodeBlock code={ex.good.code} label={`✓ Correta · ${lang}`} />
            <div className="rounded-xl bg-success-soft p-4">
              <p className="mb-2 font-bold text-success">Porque funciona</p>
              <ul className="prose-limit list-disc space-y-1 pl-5">
                {ex.good.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
            <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setTab("verificar")}>
              Como verificar →
            </button>
          </>
        )}
        {tab === "verificar" && (
          <>
            <ol className="prose-limit list-decimal space-y-2 pl-5">
              {ex.verify.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ol>
            <div>
              <p className="mb-1 font-semibold">Fontes</p>
              <ul className="space-y-1">
                {ex.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                      {s.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
