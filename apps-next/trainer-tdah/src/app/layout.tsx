import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PREFS_SCRIPT } from "@/components/prefs";
import { getProfile } from "@/server/session";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PHC Trainer — formação prática sem sobrecarga", template: "%s · PHC Trainer" },
  description:
    "Formação prática no Cegid PHC Evolution desenhada para pessoas com TDAH: um passo de cada vez, repetição espaçada, exemplos resolvidos e zero ruído.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  let name: string | null = null;
  try {
    name = (await getProfile())?.name ?? null;
  } catch {
    name = null;
  }
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <AppHeader name={name} />
        <main id="conteudo" className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-12">
          {children}
        </main>
        <footer className="distraction mx-auto max-w-5xl px-4 pb-24 text-sm text-muted md:pb-8">
          Material educativo não oficial, baseado em fontes públicas. Cegid PHC® é marca dos respetivos proprietários.
        </footer>
      </body>
    </html>
  );
}
