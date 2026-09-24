import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { beltName, quizForLevel } from "@/content";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { requireProfile } from "@/server/session";
import { QuizRunner } from "./QuizRunner";

type Props = { params: Promise<{ nivel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nivel } = await params;
  return { title: `Teste nível ${nivel}` };
}

export default async function QuizPage({ params }: Props) {
  const { nivel } = await params;
  const level = Number(nivel);
  const quiz = Number.isInteger(level) ? quizForLevel(level) : undefined;
  if (!quiz) notFound();
  await requireProfile();
  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Praticar", href: "/praticar" }, { label: "Testes", href: "/praticar/testes" }, { label: `Nível ${level}` }]} />
      <h1 className="mb-4 text-2xl font-bold">
        Teste · Nível {level} · {beltName(level)}
      </h1>
      <QuizRunner level={level} questions={quiz.qs} />
    </div>
  );
}
