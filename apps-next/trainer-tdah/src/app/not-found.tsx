import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border-2 border-line bg-surface p-8 text-center">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-muted">O endereço pode estar errado ou a página mudou de sítio.</p>
      <Link href="/" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg">
        Voltar a Hoje
      </Link>
    </div>
  );
}
