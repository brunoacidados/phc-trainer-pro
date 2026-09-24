"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { submitQuizAction, type QuizResult } from "@/server/actions";

interface Q {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

/**
 * Uma pergunta por ecrã + feedback imediato com explicação (Hattie & Timperley, 2007:
 * feedback específico e imediato é dos mais eficazes). A pontuação oficial é recalculada
 * no servidor a partir das respostas — o cliente nunca envia a percentagem.
 * Trade-off assumido: as respostas estão no cliente para permitir feedback imediato;
 * é um teste de treino, não uma certificação.
 */
export function QuizRunner({ level, questions }: { level: number; questions: Q[] }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const q = questions[i];

  function next() {
    if (picked === null) return;
    const all = [...answers, picked];
    setAnswers(all);
    setPicked(null);
    if (i + 1 < questions.length) {
      setI(i + 1);
      return;
    }
    start(async () => {
      try {
        const r = await submitQuizAction(level, all);
        if ("error" in r) setError(r.error);
        else setResult(r);
      } catch {
        setError("Falhou a ligação ao guardar o resultado.");
      }
    });
  }

  if (result)
    return (
      <div className="card pop p-6 text-center" role="status">
        <p className="text-5xl font-extrabold tabular-nums">{result.pct}%</p>
        <p className="mt-2 text-xl font-bold">{result.passed ? "Aprovado ✓" : "Ainda não — e está tudo bem"}</p>
        <p className="mt-1 text-ink-soft">
          {result.correct} de {result.total} certas. Aprovação: 80%.
        </p>
        {!result.passed && <p className="reading mx-auto mt-2 text-sm text-ink-soft">Reveja as explicações das que falhou e tente outra vez amanhã. Cada tentativa é treino.</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href={`/trilha/${level}`} className="btn btn-primary">
            Voltar ao nível
          </Link>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setI(0);
              setAnswers([]);
              setResult(null);
            }}
          >
            Repetir o teste
          </button>
        </div>
      </div>
    );

  if (!q) return <p className="text-ink-soft">{pending ? "A calcular o resultado…" : error}</p>;

  const answered = picked !== null;
  return (
    <div>
      <div className="mb-3 flex justify-between text-sm text-ink-soft">
        <span>
          Pergunta <strong className="text-ink">{i + 1}</strong> de {questions.length}
        </span>
        <span>{answers.filter((a, k) => a === questions[k].answer).length} certas até agora</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-accent" style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>

      <fieldset className="card p-5">
        <legend className="sr-only">Pergunta {i + 1}</legend>
        <p className="text-xl font-semibold leading-snug">{q.q}</p>
        <div className="mt-4 space-y-2">
          {q.options.map((o, k) => {
            const isRight = k === q.answer;
            const isPicked = k === picked;
            const cls = !answered
              ? "border-line hover:border-accent"
              : isRight
                ? "border-ok bg-ok-soft"
                : isPicked
                  ? "border-bad bg-bad-soft"
                  : "border-line opacity-70";
            return (
              <button
                key={k}
                disabled={answered}
                onClick={() => setPicked(k)}
                className={`flex min-h-12 w-full items-start gap-3 rounded-xl border-2 p-3 text-left ${cls}`}
              >
                <span className="font-bold text-ink-soft">{String.fromCharCode(65 + k)}</span>
                <span className="flex-1">{o}</span>
                {answered && isRight && <span aria-label="resposta certa">✓</span>}
                {answered && isPicked && !isRight && <span aria-label="a sua resposta, errada">✗</span>}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`pop mt-4 rounded-lg p-3 ${picked === q.answer ? "bg-ok-soft" : "bg-warn-soft"}`} aria-live="polite">
            <p className="font-bold">{picked === q.answer ? "Certo." : "Não é essa."}</p>
            <p className="mt-1">{q.why}</p>
          </div>
        )}
      </fieldset>

      <div className="mt-5 flex justify-end">
        <button className="btn btn-primary" disabled={!answered || pending} onClick={next}>
          {i + 1 < questions.length ? "Seguinte →" : pending ? "A guardar…" : "Ver resultado"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-bad-soft p-3 text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
