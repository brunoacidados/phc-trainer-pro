"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FocusToggle } from "./prefs";

/** 5 destinos no máximo (limite de memória de trabalho) — sempre na mesma ordem e posição. */
export const NAV = [
  { href: "/", label: "Hoje", icon: "☀️" },
  { href: "/missoes", label: "Missões", icon: "🗺️" },
  { href: "/praticar", label: "Praticar", icon: "🧠" },
  { href: "/aprender", label: "Aprender", icon: "📚" },
  { href: "/progresso", label: "Progresso", icon: "📈" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function AppHeader({ name }: { name: string | null }) {
  const pathname = usePathname();
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:p-3 focus:text-primary-fg">
        Saltar para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b-2 border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/" className="mr-2 flex items-center gap-2 text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-fg" aria-hidden>
              P
            </span>
            <span className="hidden sm:inline">PHC Trainer</span>
          </Link>
          {name && (
            <nav aria-label="Principal" className="distraction hidden flex-1 md:block">
              <ul className="flex gap-1">
                {NAV.map((n) => {
                  const active = isActive(pathname, n.href);
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold ${
                          active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-fg"
                        }`}
                      >
                        <span className="emoji" aria-hidden>
                          {n.icon}
                        </span>
                        {n.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          <div className="ml-auto flex items-center gap-2">
            {name && <FocusToggle />}
            {name && (
              <Link
                href="/definicoes"
                aria-label="Definições"
                title="Definições"
                className={`distraction inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border-2 ${
                  isActive(pathname, "/definicoes") ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-primary"
                }`}
              >
                <span className="emoji" aria-hidden>
                  ⚙️
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>
      {name && (
        <nav aria-label="Principal (móvel)" className="distraction fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-bg md:hidden">
          <ul className="grid grid-cols-5">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${active ? "text-primary" : "text-muted"}`}
                  >
                    <span className="emoji text-xl" aria-hidden>
                      {n.icon}
                    </span>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
