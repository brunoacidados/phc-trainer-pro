import type { Metadata } from "next";
import { GLOSSARY } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageTitle } from "@/components/ui";
import { GlossaryBrowser } from "./GlossaryBrowser";

export const metadata: Metadata = { title: "Glossário" };

export default function GlossaryPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Aprender", href: "/aprender" }, { label: "Glossário" }]} />
      <PageTitle subtitle="Escreva para filtrar. Clique num termo para ver a definição.">Glossário</PageTitle>
      <GlossaryBrowser terms={GLOSSARY} />
    </div>
  );
}
