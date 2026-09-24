"use client";

import { useActionState } from "react";
import { btnClass } from "@/components/ui";
import { updateLearningSettings, type ActionResult } from "@/server/actions";

export function LearningForm({ name, dailyGoal, freeMode }: { name: string; dailyGoal: number; freeMode: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateLearningSettings, null);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1 block font-semibold">
          Nome
        </label>
        <input id="name" name="name" defaultValue={name} minLength={2} maxLength={40} required className="min-h-12 w-full rounded-xl border-2 border-line bg-bg px-4 focus:border-primary" />
      </div>
      <div>
        <label htmlFor="dailyGoal" className="mb-1 block font-semibold">
          Meta diária (micro-ações)
        </label>
        <input id="dailyGoal" name="dailyGoal" type="number" min={1} max={10} defaultValue={dailyGoal} className="min-h-12 w-32 rounded-xl border-2 border-line bg-bg px-4 focus:border-primary" />
        <p className="mt-1 text-sm text-muted">Mais vale uma meta pequena cumprida do que uma grande abandonada.</p>
      </div>
      <label className="flex min-h-12 cursor-pointer items-start gap-3">
        <input type="checkbox" name="freeMode" defaultChecked={freeMode} className="mt-1 h-6 w-6 accent-[var(--primary)]" />
        <span>
          <b>Modo livre</b> — abrir todos os níveis
          <span className="block text-sm text-muted">Útil se já tem experiência. Sem ele, cada nível abre ao praticar metade do anterior.</span>
        </span>
      </label>
      <div aria-live="polite">
        {state?.ok && <p className="rounded-xl bg-success-soft p-3 font-semibold text-success">Guardado ✓</p>}
        {state && !state.ok && <p className="rounded-xl bg-danger-soft p-3 font-semibold text-danger">{state.error}</p>}
      </div>
      <button type="submit" disabled={pending} className={btnClass("primary")}>
        {pending ? "A guardar…" : "Guardar"}
      </button>
    </form>
  );
}
