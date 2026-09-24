"use client";

import { useActionState, useState } from "react";
import { createProfile, restoreProfile, type ActionResult } from "@/server/actions";
import { btnClass } from "@/components/ui";

export function StartForms() {
  const [createState, createAction, creating] = useActionState<ActionResult | null, FormData>(createProfile, null);
  const [restoreState, restoreAction, restoring] = useActionState<ActionResult | null, FormData>(restoreProfile, null);
  const [goal, setGoal] = useState(3);
  const [showRestore, setShowRestore] = useState(false);

  return (
    <div className="space-y-6">
      <form action={createAction} className="space-y-6 rounded-2xl border-2 border-line bg-surface p-6">
        <div>
          <label htmlFor="name" className="mb-2 block text-lg font-semibold">
            1. Como se chama?
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={40}
            autoComplete="given-name"
            className="min-h-14 w-full rounded-xl border-2 border-line bg-bg px-4 text-lg focus:border-primary"
            placeholder="Ex.: Ana"
          />
        </div>
        <fieldset>
          <legend className="mb-1 text-lg font-semibold">2. Quantas micro-ações por dia?</legend>
          <p className="mb-3 text-muted">Uma micro-ação = marcar um passo, uma prova, uma carta ou um teste. Comece pequeno — pode mudar depois.</p>
          <input type="hidden" name="dailyGoal" value={goal} />
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 3, l: "3", h: "Leve (≈10 min)" },
              { v: 5, l: "5", h: "Médio (≈20 min)" },
              { v: 8, l: "8", h: "Intenso (≈40 min)" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={goal === o.v}
                onClick={() => setGoal(o.v)}
                className={`min-h-16 rounded-xl border-2 px-2 ${goal === o.v ? "border-primary bg-primary-soft" : "border-line bg-bg hover:border-primary"}`}
              >
                <span className="block text-2xl font-bold">{o.l}</span>
                <span className="text-sm text-muted">{o.h}</span>
              </button>
            ))}
          </div>
        </fieldset>
        {createState && !createState.ok && (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 font-semibold text-danger">
            {createState.error}
          </p>
        )}
        <button type="submit" disabled={creating} className={btnClass("primary", "lg", "w-full")}>
          {creating ? "A preparar…" : "Começar →"}
        </button>
      </form>

      <div>
        <button type="button" onClick={() => setShowRestore((v) => !v)} aria-expanded={showRestore} className="font-semibold text-primary underline underline-offset-4">
          Já tenho um perfil (código de recuperação)
        </button>
        {showRestore && (
          <form action={restoreAction} className="mt-3 space-y-3 rounded-2xl border-2 border-line bg-surface p-5">
            <label htmlFor="code" className="block font-semibold">
              Código de recuperação
            </label>
            <input
              id="code"
              name="code"
              required
              className="min-h-12 w-full rounded-xl border-2 border-line bg-bg px-4 font-mono focus:border-primary"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
            {restoreState && !restoreState.ok && (
              <p role="alert" className="rounded-xl bg-danger-soft p-3 font-semibold text-danger">
                {restoreState.error}
              </p>
            )}
            <button type="submit" disabled={restoring} className={btnClass("secondary")}>
              {restoring ? "A procurar…" : "Recuperar perfil"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
