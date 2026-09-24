"use client";

/**
 * Preferências de apresentação (guardadas no dispositivo — localStorage).
 * Aplicadas como atributos data-* no <html>; um script inline no <head>
 * aplica-as antes do primeiro desenho (sem "flash" de tema errado).
 */
import { useEffect, useSyncExternalStore } from "react";

export type Prefs = {
  theme: "claro" | "escuro" | "calmo";
  scale: "100" | "112" | "125";
  spacing: "normal" | "extra";
  motion: "auto" | "reduce";
  focus: "off" | "on";
};

export const DEFAULT_PREFS: Prefs = { theme: "claro", scale: "100", spacing: "normal", motion: "auto", focus: "off" };
const KEY = "phc-prefs";

export const PREFS_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}");var d=document.documentElement;d.dataset.theme=p.theme||"claro";d.dataset.scale=p.scale||"100";d.dataset.spacing=p.spacing||"normal";d.dataset.motion=p.motion||"auto";d.dataset.focus=p.focus||"off";}catch(e){}})();`;

const listeners = new Set<() => void>();
let cache: Prefs | null = null;

function read(): Prefs {
  if (cache) return cache;
  try {
    cache = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    cache = DEFAULT_PREFS;
  }
  return cache!;
}

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...read(), ...patch };
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  const d = document.documentElement;
  (Object.keys(next) as (keyof Prefs)[]).forEach((k) => (d.dataset[k] = next[k]));
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT_PREFS,
  );
}

/** Botão do cabeçalho: liga/desliga o modo foco (esconde navegação e extras). Atalho: tecla F. */
export function FocusToggle() {
  // usePrefs usa o snapshot do servidor durante a hidratação → sem desalinhamento
  const prefs = usePrefs();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setPrefs({ focus: read().focus === "on" ? "off" : "on" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const on = prefs.focus === "on";
  return (
    <button
      type="button"
      onClick={() => setPrefs({ focus: on ? "off" : "on" })}
      aria-pressed={on}
      title="Modo foco (tecla F)"
      className={`inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-3 font-semibold ${
        on ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-fg hover:border-primary"
      }`}
    >
      <span aria-hidden>{on ? "◉" : "◎"}</span>
      <span>{on ? "Sair do foco" : "Foco"}</span>
    </button>
  );
}

function Choice<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { v: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-lg font-semibold">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((o) => (
          <label
            key={o.v}
            className={`flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border-2 px-4 py-2 ${
              value === o.v ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-primary"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" className="h-5 w-5 accent-[var(--primary)]" checked={value === o.v} onChange={() => onChange(o.v)} />
              {o.label}
            </span>
            {o.hint && <span className="text-sm text-muted">{o.hint}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DisplayPrefsForm() {
  const p = usePrefs();
  return (
    <div>
      <Choice
        legend="Tema"
        value={p.theme}
        onChange={(theme) => setPrefs({ theme })}
        options={[
          { v: "claro", label: "Claro", hint: "Alto contraste" },
          { v: "escuro", label: "Escuro", hint: "Para pouca luz" },
          { v: "calmo", label: "Calmo", hint: "Baixo estímulo, sem animações" },
        ]}
      />
      <Choice
        legend="Tamanho do texto"
        value={p.scale}
        onChange={(scale) => setPrefs({ scale })}
        options={[
          { v: "100", label: "Normal" },
          { v: "112", label: "Grande" },
          { v: "125", label: "Muito grande" },
        ]}
      />
      <Choice
        legend="Espaçamento"
        value={p.spacing}
        onChange={(spacing) => setPrefs({ spacing })}
        options={[
          { v: "normal", label: "Normal" },
          { v: "extra", label: "Extra", hint: "Mais ar entre letras e linhas" },
        ]}
      />
      <Choice
        legend="Movimento"
        value={p.motion}
        onChange={(motion) => setPrefs({ motion })}
        options={[
          { v: "auto", label: "Normal", hint: "Animações curtas" },
          { v: "reduce", label: "Reduzido", hint: "Sem animações" },
        ]}
      />
    </div>
  );
}
