"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { QuizQuestion } from "@/content/types";
import { Button, ProgressBar } from "@/components/ui";
import { submitQuiz, type QuizResult } from "@/server/actions";

/**
 * Uma pergunta por ecrã + feedback imediato com explicação.
 * Feedback imediato corrige o erro antes de se consolidar e dá recompensa
 * frequente (Hattie & Timperley, 2007 — "The Power of Feedback").
 */
export function QuizRunner({ level, questions }: { level: number; questions: QuizQuestion[] }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();
  const q = questions[i];
  const last = i === questions.length - 1;

  function choose(o: number) {
    if (picked !== null) return;
    setPicked(o);
    setAnswers((a) => {
      const n = [...a];
      n[i] = o;
      return n;
    });
  }

  function next() {
    if (!last) {
      setI(i + 1);
      setPicked(null);
      return;
    }
    start(async () => {
      try {
        setResult(await submitQuiz(level, answers));
      } catch {
        setResult({ ok: false, error: "Sem ligação — o resultado não foi guardado." });
      }
    });
  }

  function restart() {
    setI(0);
    setAnswers([]);
    setPicked(null);
    setResult(null);
  }

  if (result) {
    if (!result.ok)
      return (
        <div role="alert" className="rounded-2xl bg-danger-soft p-6 text-danger">
          <p className="font-bold">{result.error}</p>
          <Button className="mt-3" onClick={next}>
            Tentar enviar de novo
          </Button>
        </div>
      );
    return (
      <div className={`pop rounded-2xl border-2 p-8 text-center ${result.passed ? "border-success bg-success-soft" : "border-warn bg-warn-soft"}`}>
        <p className={`text-5xl font-bold ${result.passed ? "text-success" : "text-warn"}`}>{result.pct}%</p>
        <p className="mt-2 text-xl font-semibold">
          {result.correct} de {result.total} certas · {result.passed ? "Aprovado ✓" : "Ainda não (precisa de 80%)"}
        </p>
        <p className="prose-limit mx-auto mt-2 text-muted">
          {result.passed
            ? "Conhecimento confirmado. Siga para as missões do próximo nível."
            : "Errar num teste é das formas mais eficazes de aprender. Reveja as explicações e tente amanhã."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={restart}>Repetir teste</Button>
          <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg">
            Voltar a Hoje
          </Link>
        </div>
      </div>
    );
  }

  const correct = picked !== null && picked === q.a;
  return (
    <div>
      <ProgressBar value={i + (picked !== null ? 1 : 0)} max={questions.length} label="Perguntas" />
      <div key={i} className="pop mt-6 rounded-2xl border-2 border-line bg-surface p-6">
        <p className="text-sm font-semibold text-muted">
          Pergunta {i + 1} de {questions.length}
        </p>
        <h2 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{q.q}</h2>
        <ul className="mt-5 space-y-2" role="radiogroup" aria-label="Opções">
          {q.o.map((opt, o) => {
            const isPicked = picked === o;
            const isRight = picked !== null && o === q.a;
            const cls = isRight
              ? "border-success bg-success-soft"
              : isPicked
                ? "border-danger bg-danger-soft"
                : picked !== null
                  ? "border-line opacity-70"
                  : "border-line hover:border-primary";
            return (
              <li key={o}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isPicked}
                  disabled={picked !== null}
                  onClick={() => choose(o)}
                  className={`flex min-h-14 w-full items-start gap-3 rounded-xl border-2 bg-bg p-4 text-left ${cls}`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-current text-sm font-bold">{String.fromCharCode(65 + o)}</span>
                  <span className="flex-1">{opt}</span>
                  {isRight && <span className="font-bold text-success">✓ Certa</span>}
                  {isPicked && !isRight && <span className="font-bold text-danger">✗</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {picked !== null && (
          <div aria-live="polite" className={`pop mt-5 rounded-xl p-4 ${correct ? "bg-success-soft" : "bg-warn-soft"}`}>
            <p className={`font-bold ${correct ? "text-success" : "text-warn"}`}>{correct ? "Certo!" : "Não é essa — veja porquê:"}</p>
            <p className="prose-limit mt-1">{q.why}</p>
          </div>
        )}
      </div>
      {picked !== null && (
        <Button variant="primary" size="lg" className="mt-5 w-full" onClick={next} disabled={pending}>
          {pending ? "A calcular…" : last ? "Ver resultado" : "Próxima pergunta →"}
        </Button>
      )}
    </div>
  );
}
