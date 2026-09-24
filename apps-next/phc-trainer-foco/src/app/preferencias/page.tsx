import type { Metadata } from "next";
import { currentPrefs } from "@/server/session";
import { Breadcrumbs, PageTitle } from "@/components/ui";
import { PrefsForm } from "@/components/PrefsForm";

export const metadata: Metadata = { title: "Preferências de leitura" };
export const dynamic = "force-dynamic";

export default async function PrefsPage() {
  const prefs = await currentPrefs();
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { label: "Preferências" }]} />
      <PageTitle title="Preferências de leitura" lead="Ajuste até ficar confortável. As mudanças aplicam-se logo." />
      <PrefsForm prefs={prefs} />
    </div>
  );
}
