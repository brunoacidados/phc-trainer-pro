import type { Metadata } from "next";
import { GLOSSARY } from "@/content";
import { Breadcrumbs, PageTitle } from "@/components/ui";
import { GlossarySearch } from "@/components/GlossarySearch";

export const metadata: Metadata = { title: "Glossário" };

export default function GlossaryPage() {
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { label: "Glossário" }]} />
      <PageTitle kicker={`${GLOSSARY.length} termos`} title="Glossário" lead="Escreva para filtrar. Clique num termo para ver a explicação." />
      <GlossarySearch entries={GLOSSARY} />
    </div>
  );
}
