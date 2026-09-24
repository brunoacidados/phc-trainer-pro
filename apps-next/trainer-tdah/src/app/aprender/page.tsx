import type { Metadata } from "next";
import Link from "next/link";
import { CODE_EXAMPLES, GLOSSARY } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Emoji, PageTitle } from "@/components/ui";
import { requireProfile } from "@/server/session";

export const metadata: Metadata = { title: "Aprender" };

const ITEMS = [
  { href: "/aprender/exemplos", icon: "💻", title: "Exemplos de código", desc: `${CODE_EXAMPLES.length} exemplos resolvidos (SQL e Xbase): problema → erro → correção → verificação.` },
  { href: "/aprender/glossario", icon: "📖", title: "Glossário", desc: `${GLOSSARY.length} termos do PHC e da fiscalidade, com pesquisa instantânea.` },
  { href: "/aprender/metodo", icon: "🔬", title: "O método (e porque funciona)", desc: "As técnicas de aprendizagem usadas aqui, com as fontes científicas." },
];

export default async function LearnPage() {
  await requireProfile();
  return (
    <div>
      <Breadcrumbs items={[{ label: "Aprender" }]} />
      <PageTitle subtitle="Material de consulta. Use quando precisar — não é obrigatório ler tudo.">Aprender</PageTitle>
      <ul className="grid gap-4 md:grid-cols-3">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex h-full flex-col rounded-2xl border-2 border-line bg-surface p-6 hover:border-primary">
              <span className="text-3xl">
                <Emoji>{i.icon}</Emoji>
              </span>
              <span className="mt-3 text-xl font-bold">{i.title}</span>
              <span className="mt-1 text-muted">{i.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
