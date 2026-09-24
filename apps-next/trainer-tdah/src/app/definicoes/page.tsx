import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DisplayPrefsForm } from "@/components/prefs";
import { Card, PageTitle, btnClass } from "@/components/ui";
import { signOut } from "@/server/actions";
import { requireProfile } from "@/server/session";
import { LearningForm } from "./LearningForm";

export const metadata: Metadata = { title: "Definições" };

export default async function SettingsPage() {
  const p = await requireProfile();
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Definições" }]} />
      <PageTitle subtitle="As mudanças de aspeto aplicam-se logo e ficam guardadas neste dispositivo.">Definições</PageTitle>
      <Card>
        <h2 className="mb-4 text-xl font-bold">Aspeto</h2>
        <DisplayPrefsForm />
        <p className="text-sm text-muted">
          Modo foco: botão &quot;Foco&quot; no topo ou tecla <kbd className="rounded border border-line px-1">F</kbd>.
        </p>
      </Card>
      <Card>
        <h2 className="mb-4 text-xl font-bold">Aprendizagem</h2>
        <LearningForm name={p.name} dailyGoal={p.dailyGoal} freeMode={p.freeMode} />
      </Card>
      <Card>
        <h2 className="mb-2 text-xl font-bold">Código de recuperação</h2>
        <p className="prose-limit text-muted">Guarde este código para abrir o seu progresso noutro dispositivo. Trate-o como uma palavra-passe.</p>
        <p className="mt-3 select-all break-all rounded-xl bg-surface-2 p-3 font-mono">{p.id}</p>
        <form action={signOut} className="mt-4">
          <button type="submit" className={btnClass("danger")}>
            Sair deste dispositivo
          </button>
        </form>
      </Card>
    </div>
  );
}
