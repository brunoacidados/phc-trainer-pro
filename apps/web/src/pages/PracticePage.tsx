import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CARDS, QUIZZES } from "@phc/content";
import { CARD_TARGET, dueCardsN, newCardsN } from "@phc/shared";
import { useProgress } from "../stores/progress.ts";
import { announceAchievements } from "../hooks/useAi.ts";
import { toast } from "../components/ui/toast.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { Spinner } from "../components/ui/misc.tsx";
import { Alert } from "../components/ui/alert.tsx";
import { Input } from "../components/ui/input.tsx";
import { cn } from "../lib/utils.ts";

export function PracticePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "cartas";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🧠 Praticar</h1>
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="cartas">🃏 Cartas ({CARDS.length})</TabsTrigger>
          <TabsTrigger value="testes">📝 Testes de nível ({QUIZZES.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="cartas">
          <CardsTab />
        </TabsContent>
        <TabsContent value="testes">
          <QuizzesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============ Cartas (SRS) ============ */
type Session = { list: number[]; idx: number; revealed: boolean } | null;

function CardsTab() {
  const state = useProgress((s) => s.state);
  const store = useProgress.getState;
  const [session, setSession] = useState<Session>(null);

  const due = state ? dueCardsN(state) : 0;
  const fresh = state ? newCardsN(state) : 0;
  const mastered = state ? Object.values(state.cards).filter((c) => c.c >= CARD_TARGET).length : 0;

  if (!state) return <Spinner />;

  function start(mode: "due" | "new" | "mix") {
    const list: number[] = [];
    const today = new Date().toISOString().slice(0, 10);
    if (mode === "due" || mode === "mix") {
      for (let i = 0; i < CARDS.length; i++) {
        const c = state!.cards[String(i)];
        if (c?.due && c.due <= today && c.c < CARD_TARGET) list.push(i);
      }
    }
    if (mode === "new" || (mode === "mix" && list.length < due + 10)) {
      for (let i = 0; i < CARDS.length && list.length < (mode === "new" ? 20 : due + 10); i++) {
        if (!state!.cards[String(i)] && !list.includes(i)) list.push(i);
      }
    }
    if (!list.length) {
      toast.info("Nada para rever agora — bom sinal! 🎉");
      return;
    }
    setSession({ list, idx: 0, revealed: false });
  }

  if (session) {
    if (session.idx >= session.list.length) {
      return (
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <p className="text-4xl">🃏🚀</p>
            <p className="text-lg font-semibold text-success">Baralho do dia dominado!</p>
            <Button onClick={() => setSession(null)}>Sair da sessão</Button>
          </CardContent>
        </Card>
      );
    }
    const gi = session.list[session.idx];
    const card = CARDS[gi];
    const cst = state.cards[String(gi)];
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>
            Carta {session.idx + 1}/{session.list.length}
            {cst?.c ? (
              <Badge variant="muted" className="ml-2">
                {cst.c}/{CARD_TARGET}
              </Badge>
            ) : (
              <Badge variant="muted" className="ml-2">
                nova
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setSession(null)}>
            ✖ sair
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/40 p-6 text-center">
            <p className="text-lg font-bold">{card.t}</p>
            {session.revealed && (
              <p className="mt-4 border-t border-dashed border-border pt-4 text-sm text-success">
                {card.b}
              </p>
            )}
          </div>
          {!session.revealed ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setSession({ ...session, revealed: true })}
            >
              👁 Mostrar resposta
            </Button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="destructive"
                onClick={async () => {
                  await store().rateCard(gi, 0);
                  setSession({ ...session, idx: session.idx + 1, revealed: false });
                }}
              >
                ❌ Errei
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await store().rateCard(gi, 1);
                  setSession({ ...session, idx: session.idx + 1, revealed: false });
                }}
              >
                🤔 Quase
              </Button>
              <Button
                onClick={async () => {
                  await store().rateCard(gi, 2);
                  setSession({ ...session, idx: session.idx + 1, revealed: false });
                }}
              >
                ✅ Sabia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="info">
        <b>🃏 Repetição espaçada NATIVA (estilo Anki)</b> — já incluída na app, com o seu progresso
        guardado na conta. <b>Não precisa de baixar nem importar nada para o Anki.</b> Estude aqui;
        o Anki externo é só opcional (export CSV em Recursos).
      </Alert>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-primary">{due}</div>
            <div className="text-xs text-muted-foreground">vencidas hoje</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-info">{fresh}</div>
            <div className="text-xs text-muted-foreground">por estudar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-success">{mastered}</div>
            <div className="text-xs text-muted-foreground">dominadas (≥{CARD_TARGET}×)</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => start("due")}>⏰ Revisar vencidas ({due})</Button>
        <Button variant="outline" onClick={() => start("new")}>
          ✨ Estudar 20 novas
        </Button>
        <Button variant="outline" onClick={() => start("mix")}>
          🔀 Sessão mista
        </Button>
      </div>
      <DeckBrowser />
      <p className="text-xs text-muted-foreground">
        Repetição espaçada: errei → +1 dia · quase → +2 dias · sabia → escada 1→2→4→7→14→30→60.
      </p>
    </div>
  );
}

/* ============ Browser de baralhos (estilo Anki: procurar/filtrar/ver estado) ============ */
function DeckBrowser() {
  const state = useProgress((s) => s.state);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [lvl, setLvl] = useState("");
  const [status, setStatus] = useState("");
  if (!state) return null;
  const today = new Date().toISOString().slice(0, 10);

  const statusOf = (i: number): string => {
    const c = state.cards[String(i)];
    if (!c) return "nova";
    if (c.c >= CARD_TARGET) return "dominada";
    if (c.due && c.due <= today) return "vencida";
    return "aprendendo";
  };

  const rows = CARDS.map((c, i) => ({ c, i }))
    .filter(({ c, i }) => {
      if (lvl !== "" && c.lv !== Number(lvl)) return false;
      if (status && statusOf(i) !== status) return false;
      if (q && !(c.t.toLowerCase().includes(q) || c.b.toLowerCase().includes(q))) return false;
      return true;
    })
    .slice(0, 100);

  const levels = Array.from(new Set(CARDS.map((c) => c.lv))).sort((a, b) => a - b);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>🗂 Browser de baralhos ({CARDS.length} cartas)</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          {open ? "Fechar" : "Abrir"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input className="min-w-40 flex-1" placeholder="Procurar carta…" value={q} onChange={(e) => setQ(e.target.value.toLowerCase())} />
            <select className="rounded-md border border-input bg-background/60 px-2 py-1.5 text-sm" value={lvl} onChange={(e) => setLvl(e.target.value)}>
              <option value="">Todos os níveis</option>
              {levels.map((l) => <option key={l} value={l}>Nível {l}</option>)}
            </select>
            <select className="rounded-md border border-input bg-background/60 px-2 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos os estados</option>
              <option value="nova">Nova</option>
              <option value="aprendendo">Aprendendo</option>
              <option value="vencida">Vencida</option>
              <option value="dominada">Dominada</option>
            </select>
          </div>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {rows.map(({ c, i }) => (
              <details key={i} className="rounded-md border border-border">
                <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                  <Badge variant={statusOf(i) === "dominada" ? "success" : statusOf(i) === "vencida" ? "warning" : statusOf(i) === "nova" ? "muted" : "info"}>
                    {statusOf(i)}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate">{c.t}</span>
                  <span className="text-xs text-muted-foreground">N{c.lv}</span>
                </summary>
                <div className="border-t border-border px-3 py-2 text-sm text-success">{c.b}</div>
              </details>
            ))}
            {rows.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma carta com esses filtros.</p>}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/* ============ Testes de nível ============ */
function QuizzesTab() {
  const state = useProgress((s) => s.state);
  const store = useProgress.getState;
  const [active, setActive] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<number | null>(null);

  const quiz = active !== null ? QUIZZES.find((q) => q.lv === active) : null;

  if (!state) return <Spinner />;

  if (quiz) {
    const pct = submitted;
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>
            📝 {quiz.nome} — {quiz.qs.length} perguntas{" "}
            {pct !== null && (
              <Badge variant={pct >= 80 ? "success" : "destructive"} className="ml-2">
                {pct}% {pct >= 80 ? "aprovado" : "reprovado"}
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActive(null);
              setAnswers({});
              setSubmitted(null);
            }}
          >
            ✖ sair
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.qs.map((q, qi) => (
            <div key={qi} className="rounded-md border border-border p-3">
              <p className="mb-2 text-sm font-medium">
                {qi + 1}. {q.q}
              </p>
              <div className="space-y-1">
                {q.o.map((opt, oi) => (
                  <label
                    key={oi}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm hover:bg-secondary/50",
                      pct !== null && oi === q.a && "border-success/60 bg-success/10",
                      pct !== null &&
                        answers[qi] === oi &&
                        oi !== q.a &&
                        "border-destructive/60 bg-destructive/10",
                    )}
                  >
                    <input
                      type="radio"
                      name={`q${qi}`}
                      className="mt-1 accent-[#f5a623]"
                      disabled={pct !== null}
                      checked={answers[qi] === oi}
                      onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {pct !== null && (
                <p className="mt-2 rounded bg-secondary/60 p-2 text-xs text-muted-foreground">
                  💡 {q.why}
                </p>
              )}
            </div>
          ))}
          {pct === null ? (
            <Button
              className="w-full"
              disabled={Object.keys(answers).length < quiz.qs.length}
              onClick={async () => {
                const correct = quiz.qs.filter((q, i) => answers[i] === q.a).length;
                const score = Math.round((correct / quiz.qs.length) * 100);
                setSubmitted(score);
                const unlocked = await store().submitQuiz(quiz.lv, score);
                announceAchievements(unlocked);
                toast[score >= 80 ? "success" : "error"](
                  score >= 80
                    ? `Aprovado com ${score}%! 🎓`
                    : `${score}% — precisa de ≥80%. Reveja a teoria e tente outra vez.`,
                );
              }}
            >
              Submeter teste ({Object.keys(answers).length}/{quiz.qs.length} respondidas)
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAnswers({});
                setSubmitted(null);
              }}
            >
              🔄 Tentar novamente
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Aprovação ≥ 80%. O nível só avança com todas as missões 🧠 + teste aprovado.
      </p>
      {QUIZZES.map((q) => {
        const st = state.quiz[String(q.lv)];
        return (
          <Card key={q.lv}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <span className="font-medium">
                  Nível {q.lv} · {q.nome}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">{q.qs.length} perguntas</span>
              </div>
              <div className="flex items-center gap-2">
                {st && (
                  <Badge variant="muted">
                    melhor: {st.best}% · {st.tries}×{" "}
                  </Badge>
                )}
                {st?.passed && <Badge variant="success">✔ aprovado</Badge>}
                <Button
                  size="sm"
                  onClick={() => {
                    setActive(q.lv);
                    setAnswers({});
                    setSubmitted(null);
                  }}
                >
                  {st ? "Repetir" : "Iniciar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
