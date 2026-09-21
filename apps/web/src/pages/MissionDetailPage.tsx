import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckSquare,
  ChevronDown,
  Lightbulb,
  Play,
  Square,
  Timer,
  Volume2,
} from "lucide-react";
import { GRADE_NOTES, ENC_REF, labById, theoryFor } from "@phc/content";
import {
  applyCompanyText,
  fmtD,
  journeyPath,
  LADDER,
  missionUnlocked,
  REP_TARGET,
} from "@phc/shared";
import { useProgress } from "../stores/progress.ts";
import { useUi } from "../stores/ui.ts";
import { useAi, announceAchievements } from "../hooks/useAi.ts";
import { openFocusFor } from "../features/focus/FocusModal.tsx";
import { startLabLesson } from "../features/lesson/LessonDrawer.tsx";
import { useTts } from "../hooks/useTts.ts";
import { toast } from "../components/ui/toast.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { Alert } from "../components/ui/alert.tsx";
import { Input, Select, Textarea } from "../components/ui/input.tsx";
import { Spinner } from "../components/ui/misc.tsx";
import { cn } from "../lib/utils.ts";
import { LevelImage } from "../components/ui/LevelImage.tsx";

export function MissionDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const state = useProgress((s) => s.state);
  const status = useProgress((s) => s.status);
  const store = useProgress.getState;
  const ai = useAi();
  const tts = useTts();

  const lab = labById(id);
  const theory = theoryFor(id);
  const st = state?.labs[id];

  const [openAsk, setOpenAsk] = useState<number | null>(null);
  const [explainCache, setExplainCache] = useState<Record<string, string>>({});
  const [evKind, setEvKind] = useState("print");
  const [evTxt, setEvTxt] = useState("");
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const timerStartRef = useRef<number | null>(null);

  const path = useMemo(() => (state ? journeyPath(state.plan) : []), [state]);
  const pos = path.indexOf(id);
  const setLastLab = useUi((s) => s.setLastLab);

  // contexto do chat global: missão atual
  useEffect(() => {
    setLastLab(id);
  }, [id, setLastLab]);

  if (!state || status !== "ready") {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!lab) {
    return (
      <Alert variant="destructive">
        Missão {id} não encontrada.{" "}
        <Link className="underline" to="/missoes">
          Voltar à trilha
        </Link>
      </Alert>
    );
  }
  if (!missionUnlocked(state, id)) {
    return (
      <Alert variant="warning">
        🔒 Esta missão ainda está bloqueada — conclua a anterior primeiro.{" "}
        <Link className="underline" to="/missoes">
          Ver trilha
        </Link>
      </Alert>
    );
  }

  const emp = (t: string) => applyCompanyText(t, state.company);

  async function explain(key: string, text: string, title: string) {
    if (explainCache[key]) return;
    try {
      const out = await ai.explain(text, title, id);
      setExplainCache((c) => ({ ...c, [key]: out }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const gradeNote = GRADE_NOTES[id];
  const encRefs = ENC_REF[id] ?? [];
  const labEvid = state.evid.filter((e) => e.lab === id);

  function startTimer() {
    timerStartRef.current = Date.now();
    setTimerStart(timerStartRef.current);
    setElapsed(null);
    timerRef.current = window.setInterval(() => {
      if (timerStartRef.current)
        setElapsed(Math.round((Date.now() - timerStartRef.current) / 1000));
    }, 1000);
  }
  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const secs = timerStartRef.current
      ? Math.round((Date.now() - timerStartRef.current) / 1000)
      : null;
    timerStartRef.current = null;
    setTimerStart(null);
    setElapsed(secs);
  }

  return (
    <div className="space-y-5">
      {/* cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/missoes"
              className="text-muted-foreground hover:text-foreground"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Badge variant="outline" className="font-mono">
              {lab.id}
            </Badge>
            <Badge variant="secondary">Nível {lab.lv}</Badge>
            {st?.mem && <Badge variant="success">🧠 dominada</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-bold">{emp(lab.t)}</h1>
          <p className="text-sm text-muted-foreground">
            ~{lab.min} min {st?.c ? `· ${st.c}/${REP_TARGET} repetições` : ""}{" "}
            {st?.due ? `· próx. revisão ${fmtD(st.due)}` : ""} · ref: {lab.ref}
          </p>
        </div>
        <div className="flex gap-2">
          {pos > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/missoes/${path[pos - 1]}`)}
            >
              <ArrowLeft className="h-3 w-3" /> {path[pos - 1]}
            </Button>
          )}
          {pos >= 0 && pos < path.length - 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/missoes/${path[pos + 1]}`)}
            >
              {path[pos + 1]} <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {gradeNote && (
        <Alert variant="info">
          <b>📦 Requisitos de gama:</b> {gradeNote}
        </Alert>
      )}

      {encRefs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">📕 Enciclopédia:</span>
          {encRefs.map((r) => (
            <Link key={r} to={`/aprender?tab=enciclopedia&q=${encodeURIComponent(r)}`}>
              <Badge variant="info" className="cursor-pointer hover:opacity-80">
                {r}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {lab.links && lab.links.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-border bg-card/50 p-3">
          <span className="text-xs font-medium text-muted-foreground">
            🔗 Recursos oficiais (Help Center · vídeos · certificação):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {lab.links.map((l) => (
              <a
                key={l.u + l.t}
                href={l.u}
                target="_blank"
                rel="noreferrer noopener"
                title={l.u}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:border-primary/50 hover:text-primary"
              >
                <span aria-hidden>
                  {l.k === "manual"
                    ? "📕"
                    : l.k === "video"
                      ? "🎬"
                      : l.k === "canal"
                        ? "📺"
                        : l.k === "legal"
                          ? "⚖️"
                          : "📄"}
                </span>
                <span className="truncate">{l.t}</span>
                <span aria-hidden className="text-[10px] opacity-60">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ações principais */}
      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={() => openFocusFor(id)}>
          ▶ Iniciar passo a passo (Modo Foco)
        </Button>
        <Button size="lg" variant="secondary" onClick={() => startLabLesson(id, state)}>
          🎓 Aula guiada
        </Button>
      </div>

      <figure className="overflow-hidden rounded-xl border border-border bg-card">
        <LevelImage lv={lab.lv} className="h-44 w-full sm:h-56" />
        <figcaption className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          💡 Exemplo ilustrativo do que vai fazer neste nível (imagem gerada para orientação).
        </figcaption>
      </figure>

      {/* objetivo + conceito */}
      <Card className="border-info/40">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-info">🎯 Objetivo</CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              title="Ouvir"
              onClick={() => void tts.speak(`${emp(lab.goal)}. ${theory ? emp(theory.c) : ""}`)}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Explicar com IA"
              loading={ai.loading}
              onClick={() =>
                void explain("goal", `${lab.goal} ${theory?.c ?? ""}`, "objetivo da missão")
              }
            >
              <Brain className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{emp(lab.goal)}</p>
          {explainCache["goal"] && (
            <p className="rounded-md bg-secondary/60 p-3 text-sm text-foreground">
              {explainCache["goal"]}
            </p>
          )}
        </CardContent>
      </Card>

      {theory && (
        <Card className="border-info/30 bg-[#0f1d33]">
          <CardHeader>
            <CardTitle className="text-info">📖 Conceito antes da prática</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{emp(theory.c)}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => void tts.speak(emp(theory.c))}>
                <Volume2 className="mr-1 h-3 w-3" /> Ouvir
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={ai.loading}
                onClick={() => void explain("concept", theory.c, "conceito da missão")}
              >
                <Brain className="mr-1 h-3 w-3" /> Explicar simples
              </Button>
            </div>
            {explainCache["concept"] && (
              <p className="rounded-md bg-secondary/60 p-3 text-sm">{explainCache["concept"]}</p>
            )}

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                Conceitos-chave
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {theory.s.map(([t, d], i) => (
                  <div key={i} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <b className="text-sm text-accent">{t}</b>
                      <button
                        className="cursor-pointer text-muted-foreground hover:text-info"
                        title="Explicar com IA"
                        onClick={() => void explain(`s${i}`, `${t}: ${d}`, t)}
                      >
                        <Brain className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{emp(d)}</p>
                    {explainCache[`s${i}`] && (
                      <p className="mt-2 rounded bg-secondary/60 p-2 text-xs">
                        {explainCache[`s${i}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {theory.e.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">
                  ⚠ Erros comuns
                </h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {theory.e.map((e, i) => (
                    <li key={i}>{emp(e)}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* passos */}
        <Card>
          <CardHeader>
            <CardTitle>
              🛠️ Passos no PHC ({Object.values(st?.steps ?? {}).filter(Boolean).length}/
              {lab.steps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {lab.steps.map((s, i) => (
                <li key={i}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-2 text-sm",
                      st?.steps?.[String(i)] && "text-muted-foreground line-through opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[#f5a623]"
                      checked={!!st?.steps?.[String(i)]}
                      onChange={() => void store().toggleStep(id, i)}
                    />
                    <span>{emp(s)}</span>
                  </label>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* provas da missão */}
        <Card>
          <CardHeader>
            <CardTitle>
              ✅ Provas exigidas ({Object.values(st?.proofs ?? {}).filter(Boolean).length}/
              {lab.proofs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lab.proofs.map((p, i) => (
              <label
                key={i}
                className={cn(
                  "flex cursor-pointer items-start gap-2 text-sm",
                  st?.proofs?.[String(i)] && "text-muted-foreground line-through opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#3ddc84]"
                  checked={!!st?.proofs?.[String(i)]}
                  onChange={() => void store().toggleProof(id, i)}
                />
                <span>
                  {p.k === "print" ? "🖼" : p.k === "file" ? "📄" : p.k === "sql" ? "🗄" : "🎙"}{" "}
                  {emp(p.d)}
                </span>
              </label>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              Convenção:{" "}
              <code className="rounded bg-secondary px-1">
                C:\PHC-Treino\evidencias\{id}\AAAA-MM-DD-&lt;descricao&gt;.png
              </code>{" "}
              — sem evidência, não aconteceu.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* perguntas */}
      {lab.ask.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>❓ Verifique o entendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lab.ask.map((a, i) => (
              <div key={i} className="rounded-md border border-border bg-[#141b2e]">
                <button
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left text-sm"
                  onClick={() => setOpenAsk(openAsk === i ? null : i)}
                >
                  <span>{emp(a.q)}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      openAsk === i && "rotate-180",
                    )}
                  />
                </button>
                {openAsk === i && (
                  <div className="border-t border-border px-4 py-3">
                    <p className="text-sm text-success">{emp(a.a)}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      loading={ai.loading}
                      onClick={() =>
                        void explain(`ask${i}`, `${a.q} — ${a.a}`, "pergunta da missão")
                      }
                    >
                      <Brain className="mr-1 h-3 w-3" /> Aprofundar com o Professor
                    </Button>
                    {explainCache[`ask${i}`] && (
                      <p className="mt-2 rounded bg-secondary/60 p-2 text-xs">
                        {explainCache[`ask${i}`]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* evidências */}
      <Card>
        <CardHeader>
          <CardTitle>📸 Portefólio — provas desta missão ({labEvid.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select className="w-40" value={evKind} onChange={(e) => setEvKind(e.target.value)}>
              <option value="print">🖼 print</option>
              <option value="sql">🗄 sql</option>
              <option value="file">📄 ficheiro</option>
              <option value="oral">🎙 explicação</option>
            </Select>
            <Input
              className="min-w-52 flex-1"
              placeholder="Descrição / nome do ficheiro"
              value={evTxt}
              onChange={(e) => setEvTxt(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && evTxt.trim().length >= 3) {
                  const unlocked = await store().addEvidence(id, evKind, evTxt.trim());
                  setEvTxt("");
                  toast.success("Prova registada! 📸");
                  announceAchievements(unlocked);
                }
              }}
            />
            <Button
              disabled={evTxt.trim().length < 3}
              onClick={async () => {
                const unlocked = await store().addEvidence(id, evKind, evTxt.trim());
                setEvTxt("");
                toast.success("Prova registada! 📸");
                announceAchievements(unlocked);
              }}
            >
              + Registar
            </Button>
          </div>
          {labEvid.length > 0 && (
            <ul className="space-y-1 text-sm">
              {labEvid.slice(0, 8).map((e, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="muted">{e.kind}</Badge> {e.txt}{" "}
                  <span className="ml-auto text-xs">{fmtD(e.d)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* repetição / domínio */}
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-primary">🔁 Repetição espaçada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Escada: {LADDER.join(" → ")} dias · meta: {REP_TARGET} repetições + 🧠 "sei de cor" · a
            partir da 3ª, cronometre (meta {lab.meta}).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={async () => {
                const unlocked = await store().registerRep(id, elapsed ?? undefined);
                toast.success("+1 repetição registada. Constância gera competência.");
                announceAchievements(unlocked);
                setElapsed(null);
              }}
            >
              <CheckSquare className="h-4 w-4" /> Registar repetição
            </Button>
            <Button
              variant="success"
              disabled={!!st?.mem}
              onClick={async () => {
                const unlocked = await store().markMastered(id);
                toast.success("🧠 DE COR E SALTEADO! Missão dominada.");
                announceAchievements(unlocked);
              }}
            >
              <Brain className="h-4 w-4" /> {st?.mem ? "Dominada" : "Sei de cor"}
            </Button>
            {timerStart === null ? (
              <Button variant="outline" onClick={startTimer}>
                <Timer className="h-4 w-4" /> Cronometrar
              </Button>
            ) : (
              <Button variant="outline" onClick={stopTimer}>
                <Square className="h-4 w-4" /> Parar ({elapsed ?? 0}s)
              </Button>
            )}
            {elapsed !== null && timerStart === null && (
              <Badge variant="info">⏱ {elapsed}s — será guardado com a repetição</Badge>
            )}
            {st?.timed?.length ? (
              <Badge variant="muted">
                tempos:{" "}
                {st.timed
                  .slice(-3)
                  .map((t) => `${t}s`)
                  .join(", ")}
              </Badge>
            ) : null}
          </div>
          {st?.hist?.length ? (
            <p className="text-xs text-muted-foreground">
              Histórico: {st.hist.slice(-8).map(fmtD).join(" · ")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* notas rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Lightbulb className="mr-1 inline h-4 w-4 text-accent" /> Dúvida rápida ao Professor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuickAsk labId={id} />
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAsk({ labId }: { labId: string }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const ai = useAi();
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          rows={2}
          placeholder={`Pergunte qualquer coisa sobre esta missão (${labId})…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button
          disabled={!q.trim()}
          loading={ai.loading}
          onClick={async () => {
            try {
              const r = await ai.chat({
                kind: "chat",
                labId,
                maxTokens: 700,
                messages: [{ role: "user", content: q }],
              });
              setA(r.text);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          <Play className="h-4 w-4" /> Perguntar
        </Button>
      </div>
      {a && <p className="whitespace-pre-wrap rounded-md bg-secondary/60 p-3 text-sm">{a}</p>}
    </div>
  );
}
