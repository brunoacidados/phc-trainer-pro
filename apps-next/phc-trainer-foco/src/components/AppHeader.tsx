"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { savePrefs } from "@/server/actions";

/**
 * Navegação: 4 destinos principais + "Mais". Menos opções visíveis = menos decisões (Hick, 1952).
 * Modo foco: só a marca, "Hoje" e o botão para sair — nada compete com a tarefa atual.
 */
const PRIMARY = [
  { href: "/", label: "Hoje", icon: "☀️" },
  { href: "/trilha", label: "Trilha", icon: "🧭" },
  { href: "/praticar", label: "Praticar", icon: "🧠" },
  { href: "/exemplos", label: "Código", icon: "💻" },
];
const MORE = [
  { href: "/progresso", label: "O meu progresso" },
  { href: "/glossario", label: "Glossário" },
  { href: "/metodo", label: "Como funciona o método" },
  { href: "/preferencias", label: "Preferências de leitura" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function AppHeader({ focus }: { focus: boolean }) {
  const path = usePathname();
  const [pending, start] = useTransition();
  const onMission = path.startsWith("/missao/");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 sm:px-6">
        <Link href="/" className="mr-auto flex items-center gap-2 py-2 font-bold text-ink no-underline" aria-label="PHC Trainer — início">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm text-accent-ink">
            PHC
          </span>
          <span className="hidden sm:inline">Trainer</span>
        </Link>

        {focus ? (
          <>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">Modo foco</span>
            <button className="btn btn-secondary !min-h-10 !py-1 text-sm" disabled={pending} onClick={() => start(() => savePrefs({ focus: false }))}>
              Sair do foco
            </button>
          </>
        ) : (
          <>
            <nav aria-label="Principal" className="flex items-center gap-1">
              {PRIMARY.map((l) => {
                const active = isActive(path, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold no-underline sm:px-3 ${
                      active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <span aria-hidden>{l.icon}</span>
                    <span className={active ? "" : "hidden sm:inline"}>{l.label}</span>
                  </Link>
                );
              })}
            </nav>
            <details className="relative">
              <summary className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-surface-2" aria-label="Mais opções">
                Mais <span aria-hidden className="chev ml-1 inline-block">›</span>
              </summary>
              <ul className="card absolute right-0 mt-2 w-60 p-2">
                {MORE.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block rounded-lg px-3 py-2.5 text-ink no-underline hover:bg-surface-2">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
            {onMission && (
              <button
                className="btn btn-ghost !min-h-11 text-sm"
                disabled={pending}
                onClick={() => start(() => savePrefs({ focus: true }))}
                title="Esconder navegação e distrações"
              >
                Foco
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
