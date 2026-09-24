import { notFound } from "next/navigation";
import { quizOfLevel } from "@/content";
import { Breadcrumbs, PageTitle } from "@/components/ui";
import { QuizRunner } from "@/components/QuizRunner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ nivel: string }> }) {
  const q = quizOfLevel(Number((await params).nivel));
  return { title: q ? `Teste — ${q.name}` : "Teste" };
}

export default async function QuizPage({ params }: { params: Promise<{ nivel: string }> }) {
  const level = Number((await params).nivel);
  const quiz = Number.isInteger(level) ? quizOfLevel(level) : undefined;
  if (!quiz) notFound();
  return (
    <div>
      <Breadcrumbs
        items={[
          { href: "/", label: "Hoje" },
          { href: "/praticar", label: "Praticar" },
          { label: `Teste nível ${level}` },
        ]}
      />
      <PageTitle kicker={`Teste · Nível ${level}`} title={quiz.name} lead={`${quiz.questions.length} perguntas, uma de cada vez. Vê a explicação logo a seguir a cada resposta.`} />
      <QuizRunner level={level} questions={quiz.questions} />
    </div>
  );
}
