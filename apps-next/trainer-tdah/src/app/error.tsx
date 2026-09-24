"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border-2 border-danger bg-danger-soft p-8 text-center">
      <h1 className="text-2xl font-bold text-danger">Algo correu mal do nosso lado</h1>
      <p className="mt-2">O seu progresso anterior está guardado. Tente outra vez.</p>
      <button type="button" onClick={reset} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg">
        Tentar de novo
      </button>
    </div>
  );
}
