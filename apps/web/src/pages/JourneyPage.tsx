import { Link } from "react-router-dom";
import { BELTS, LABS, labById } from "@phc/content";
import {
  applyCompanyText,
  currentBelt,
  currentMission,
  DAILY_GOAL,
  dailyActions,
  dueCardsN,
  dueLabs,
  labsMastered,
  newCardsN,
  overallPct,
  totalReps,
  xpTotal,
  fmtD,
} from "@phc/shared";
import { useProgress } from "../stores/progress.ts";
import { useSession } from "../stores/session.ts";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.ts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button, buttonVariants } from "../components/ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { CircleProgress, ProgressBar } from "../components/ui/progress.tsx";
import { Spinner } from "../components/ui/misc.tsx";
import { ArrowRight, BookOpen, Brain, Flame, GraduationCap, Target } from "lucide-react";
import { openFocusFor } from "../features/focus/FocusModal.tsx";
import { startLabLesson } from "../features/lesson/LessonDrawer.tsx";
import { useOnboard } from "../features/onboard/OnboardModal.tsx";
import { SectorTrackPanel } from "../features/sector/SectorTrackPanel.tsx";

export function JourneyPage() {
  const state = useProgress((s) => s.state);
  const status = useProgress((s) => s.status);
  const user = useSession((s) => s.user);

  if (!state || status !== "ready") {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const company = state.company;
  const emp = (t: string) => applyCompanyText(t, company);
  const current = currentMission(state);
  const curLab = current ? labById(current) : null;
  const due = dueLabs(state);
  const dueCards = dueCardsN(state);
  const freshCards = newCardsN(state);
  const actions = dailyActions(state);
  const belt = BELTS[currentBelt(state)];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">
            A treinar em{" "}
            <b className="text-foreground">
              {company?.segIco} {company?.nome}
            </b>{" "}
            · {state.contexto.pais} · gama {state.contexto.gama}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CircleProgress value={(actions / DAILY_GOAL) * 100} label={`${actions}/${DAILY_GOAL}`} />
          <div className="text-xs text-muted-foreground">
            meta diária
            <br />
            (5 ações)
          </div>
        </div>
      </div>

      {/* missão atual */}
      {curLab ? (
        <Card className="border-primary/40">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-primary">
              <Target className="mr-2 inline h-5 w-5" />
              Missão atual · {curLab.id}
            </CardTitle>
            <Badge variant="secondary">
              Nível {curLab.lv} · {belt.name}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold">{emp(curLab.t)}</h2>
            <p className="text-sm text-muted-foreground">{emp(curLab.goal)}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className={cn(buttonVariants(), "gap-2")}
                onClick={() => openFocusFor(curLab.id)}
              >
                ▶ Iniciar passo a passo <ArrowRight className="h-4 w-4" />
              </button>
              <button
                className={cn(buttonVariants({ variant: "secondary" }))}
                onClick={() => startLabLesson(curLab.id, state)}
              >
                🎓 Aula guiada
              </button>
              <Link
                to={`/missoes/${curLab.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Ver ficha completa
              </Link>
              <Link
                to="/praticar?tab=cartas"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                🃏 Cartas do dia ({dueCards + Math.min(freshCards, 20)})
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold text-success">🎖️ Todas as missões concluídas!</p>
            <p className="text-sm text-muted-foreground">
              Continue com as revisões e os testes para consolidar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* revisões vencidas */}
      {(due.length > 0 || dueCards > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-accent">🔔 Revisões de hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {due.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Missões vencidas:</span>
                {due.slice(0, 12).map((id) => {
                  const l = labById(id)!;
                  return (
                    <Link key={id} to={`/missoes/${id}`}>
                      <Badge variant="warning" className="cursor-pointer hover:opacity-80">
                        {id} · {emp(l.t).slice(0, 28)}… ({fmtD(state.labs[id]?.due)})
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
            {dueCards > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{dueCards} cartas vencidas</span>
                <Link to="/praticar?tab=cartas">
                  <Button size="sm" variant="secondary">
                    Revisar agora
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <MyAssignments />

      {/* curso personalizado */}
      <CourseCard />

      {/* trilha vertical do setor — Portas & Automatismos (PORTALUSA) */}
      <SectorTrackPanel />

      {/* números */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Flame className="h-5 w-5 text-primary" />}
          label="Sequência"
          value={`${state.streak.n} dias`}
        />
        <Stat
          icon={<BookOpen className="h-5 w-5 text-info" />}
          label="Repetições"
          value={String(totalReps(state))}
        />
        <Stat
          icon={<Brain className="h-5 w-5 text-success" />}
          label="Missões 🧠"
          value={`${labsMastered(state)}/${LABS.length}`}
        />
        <Stat
          icon={<Target className="h-5 w-5 text-accent" />}
          label="XP total"
          value={String(xpTotal(state))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso geral</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={overallPct(state)}
            label="Domínio do curso (missões 70% + testes 20% + cartas 10%)"
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface MyAssignment {
  id: string;
  title: string;
  labIds: string[];
  dueDate: string;
}
function MyAssignments() {
  const team = useSession((s) => s.team);
  const state = useProgress((s) => s.state);
  const q = useQuery({
    queryKey: ["my-assignments", team?.id],
    queryFn: () => apiFetch<{ assignments: MyAssignment[] }>(`/api/teams/${team?.id}/assignments`),
    enabled: !!team?.id,
  });
  const items = (q.data?.assignments ?? []).filter((a) => {
    const done = a.labIds.filter((l) => (state?.labs[l]?.c ?? 0) > 0 || state?.labs[l]?.mem).length;
    return done < a.labIds.length;
  });
  if (!team || items.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-accent">📌 As suas atribuições</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => {
          const done = a.labIds.filter(
            (l) => (state?.labs[l]?.c ?? 0) > 0 || state?.labs[l]?.mem,
          ).length;
          return (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2"
            >
              <div>
                <b className="text-sm">{a.title}</b>
                <div className="text-xs text-muted-foreground">
                  {a.labIds.join(", ")} · {done}/{a.labIds.length}
                </div>
              </div>
              <Badge variant={a.dueDate < today ? "destructive" : "warning"}>
                prazo {a.dueDate}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CourseCard() {
  const state = useProgress((s) => s.state)!;
  const openWizard = useOnboard((s) => s.openWizard);
  if (!state.plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-accent">
            <GraduationCap className="mr-2 inline h-5 w-5" /> Crie o seu curso personalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            3 passos: segmento → empresa → objetivos. A IA monta o curso à sua medida (hotel,
            eletrónica, obras… qualquer negócio).
          </p>
          <Button onClick={openWizard}>Começar agora</Button>
        </CardContent>
      </Card>
    );
  }
  const ord = [...(state.plan.ordem ?? []), ...(state.plan.destaques ?? [])];
  const next = ord.map((id) => labById(id)).find((l) => l && !(state.labs[l.id]?.c >= 1));
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-accent">
          <GraduationCap className="mr-2 inline h-5 w-5" /> Curso personalizado
        </CardTitle>
        <Badge variant={state.plan.porIA ? "warning" : "muted"}>
          {state.plan.porIA ? "por IA" : "segmento"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{state.plan.nota}</p>
        {next ? (
          <p className="text-sm">
            Próxima recomendada:{" "}
            <b>
              {next.id} — {applyCompanyText(next.t, state.company)}
            </b>
            <Link
              to={`/missoes/${next.id}`}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "ml-2")}
            >
              Abrir
            </Link>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Recomendadas já iniciadas — siga as repetições do dia!
          </p>
        )}
        <button className="text-xs text-info hover:underline" onClick={openWizard}>
          🎓 Refazer entrevista de curso
        </button>
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        {icon}
        <div>
          <div className="text-lg font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
