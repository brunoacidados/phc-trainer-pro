import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <p className="text-4xl" aria-hidden>
        🧭
      </p>
      <h1 className="mt-2 text-2xl font-bold">Esta página não existe</h1>
      <p className="mt-2 text-ink-soft">O link pode estar desatualizado. O seu progresso está guardado.</p>
      <Link href="/" className="btn btn-primary mt-5">
        Voltar a Hoje
      </Link>
    </div>
  );
}
