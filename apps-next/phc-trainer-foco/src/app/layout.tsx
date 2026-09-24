import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { currentPrefs } from "@/server/session";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = {
  title: { default: "PHC Trainer — Foco", template: "%s · PHC Trainer" },
  description: "Formação prática em Cegid PHC, desenhada para pessoas com TDAH: uma ação de cada vez, prova de competência e repetição espaçada.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const prefs = await currentPrefs();
  return (
    <html lang="pt-PT" data-theme={prefs.theme} data-size={prefs.size} data-motion={prefs.calmMotion ? "calmo" : "normal"}>
      <body className="min-h-screen">
        <a href="#conteudo" className="sr-only-focusable fixed left-3 top-3 z-50 btn btn-primary">
          Saltar para o conteúdo
        </a>
        <AppHeader focus={prefs.focus} />
        <main id="conteudo" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
