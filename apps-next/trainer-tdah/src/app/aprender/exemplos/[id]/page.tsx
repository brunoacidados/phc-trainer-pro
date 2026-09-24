import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exampleById, labById } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExampleView } from "@/components/ExampleView";
import { PageTitle } from "@/components/ui";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: exampleById(id)?.title ?? "Exemplo" };
}

export default async function ExamplePage({ params }: Props) {
  const { id } = await params;
  const ex = exampleById(id);
  if (!ex) notFound();
  return (
    <div>
      <Breadcrumbs items={[{ label: "Aprender", href: "/aprender" }, { label: "Exemplos", href: "/aprender/exemplos" }, { label: ex.title }]} />
      <PageTitle>{ex.title}</PageTitle>
      <ExampleView ex={ex} />
      <div className="mt-8 rounded-2xl border-2 border-line bg-surface p-5">
        <p className="font-semibold">Pratique nas missões:</p>
        <ul className="mt-2 space-y-1">
          {ex.missions.map((m) => (
            <li key={m}>
              <Link href={`/missoes/${m}`} className="text-primary underline underline-offset-4">
                {m} · {labById(m)?.t ?? ""}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
