"use client";
import { useOptimistic, useTransition } from "react";
import { savePrefs } from "@/server/actions";
import type { Prefs } from "@/lib/prefs";

function Group<T extends string>({
  legend,
  hint,
  value,
  options,
  onChange,
}: {
  legend: string;
  hint: string;
  value: T;
  options: { v: T; label: string; desc: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 font-bold">{legend}</legend>
      <p className="mb-3 text-sm text-ink-soft">{hint}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((o) => (
          <label key={o.v} className={`flex cursor-pointer flex-col rounded-xl border-2 p-3 ${value === o.v ? "border-accent bg-accent-soft" : "border-line hover:border-accent"}`}>
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name={legend} checked={value === o.v} onChange={() => onChange(o.v)} className="h-4 w-4 accent-[var(--accent)]" />
              {o.label}
            </span>
            <span className="mt-1 text-sm text-ink-soft">{o.desc}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="card flex cursor-pointer items-start gap-3 p-5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
      <span>
        <span className="block font-bold">{label}</span>
        <span className="block text-sm text-ink-soft">{desc}</span>
      </span>
    </label>
  );
}

export function PrefsForm({ prefs }: { prefs: Prefs }) {
  const [p, setP] = useOptimistic(prefs, (s: Prefs, patch: Partial<Prefs>) => ({ ...s, ...patch }));
  const [pending, start] = useTransition();
  const set = (patch: Partial<Prefs>) =>
    start(async () => {
      setP(patch);
      await savePrefs(patch);
    });

  return (
    <div className="space-y-4">
      <Group
        legend="Tema"
        hint="O tema calmo usa cores suaves, sem sombras nem animações."
        value={p.theme}
        onChange={(v) => set({ theme: v })}
        options={[
          { v: "claro", label: "Claro", desc: "Alto contraste, fundo claro" },
          { v: "escuro", label: "Escuro", desc: "Alto contraste, fundo escuro" },
          { v: "calmo", label: "Calmo", desc: "Baixo estímulo, tons de papel" },
        ]}
      />
      <Group
        legend="Tamanho do texto"
        hint="Texto maior cansa menos em sessões longas."
        value={p.size}
        onChange={(v) => set({ size: v })}
        options={[
          { v: "normal", label: "Normal", desc: "18 px" },
          { v: "grande", label: "Grande", desc: "20 px" },
          { v: "enorme", label: "Enorme", desc: "23 px" },
        ]}
      />
      <Toggle label="Reduzir movimento" desc="Desliga todas as animações e transições." checked={p.calmMotion} onChange={(v) => set({ calmMotion: v })} />
      <Toggle
        label="Modo foco"
        desc="Esconde a navegação e as migalhas. Fica só a tarefa. Também pode ativá-lo dentro de cada missão."
        checked={p.focus}
        onChange={(v) => set({ focus: v })}
      />
      <p className="text-sm text-ink-soft" aria-live="polite">
        {pending ? "A guardar…" : "Guardado neste navegador."}
      </p>
    </div>
  );
}
