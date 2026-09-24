"use client";
import Link from "next/link";

/** Erro com linguagem calma, o que aconteceu e o que fazer — sem jargão, sem culpa. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center" role="alert">
      <p className="text-4xl" aria-hidden>
        🛠️
      </p>
      <h1 className="mt-2 text-2xl font-bold">Algo correu mal do nosso lado</h1>
      <p className="mt-2 text-ink-soft">Não foi nada que tenha feito. O progresso já guardado não se perdeu.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button className="btn btn-primary" onClick={reset}>
          Tentar outra vez
        </button>
        <Link href="/" className="btn btn-secondary">
          Voltar a Hoje
        </Link>
      </div>
    </div>
  );
}
