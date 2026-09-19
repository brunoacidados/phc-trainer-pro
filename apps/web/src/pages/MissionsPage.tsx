import { Link } from "react-router-dom";
import { Lock, CheckCircle2, Brain, ChevronRight } from "lucide-react";
import { BELTS, LABS } from "@phc/content";
import {
  applyCompanyText,
  fmtD,
  journeyPath,
  levelOpen,
  missionUnlocked,
  REP_TARGET,
  type ProgressState,
} from "@phc/shared";
import { useProgress } from "../stores/progress.ts";
import { Card, CardContent } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Spinner } from "../components/ui/misc.tsx";
import { cn } from "../lib/utils.ts";
import { LevelImage } from "../components/ui/LevelImage.tsx";

export function MissionsPage() {
  const state = useProgress((s) => s.state);
  const status = useProgress((s) => s.status);

  if (!state || status !== "ready") {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const emp = (t: string) => applyCompanyText(t, state.company);
  const path = journeyPath(state.plan);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🗺️ Missões (L00–L89)</h1>
        <p className="text-sm text-muted-foreground">
          Trilha guiada — cada missão concluída libera a seguinte; níveis abrem com 50% do anterior.{" "}
          {state.settings.freeMode && <Badge variant="info">modo livre ativo</Badge>}
        </p>
      </div>

      {BELTS.map((belt) => {
        const lvLabs = LABS.filter((l) => l.lv === belt.n).sort(
          (a, b) => path.indexOf(a.id) - path.indexOf(b.id),
        );
        if (!lvLabs.length) return null;
        const open = levelOpen(state, belt.n);
        const mastered = lvLabs.filter((l) => state.labs[l.id]?.mem).length;
        return (
          <Card key={belt.n} className={cn(!open && "opacity-60")}>
            <CardContent className="p-0">
              <div
                className="flex items-center justify-between gap-2 border-b border-border px-5 py-3"
                style={{ borderLeft: `4px solid ${belt.cor}` }}
              >
                <div className="flex items-center gap-3">
                  <LevelImage
                    lv={belt.n}
                    alt=""
                    className="hidden h-10 w-16 rounded-md border border-border sm:block"
                  />
                  <div>
                    <span className="font-semibold" style={{ color: belt.cor }}>
                      🥋 {belt.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">{belt.desc}</span>
                  </div>
                </div>
                <Badge variant={mastered === lvLabs.length ? "success" : "secondary"}>
                  {mastered}/{lvLabs.length} 🧠
                </Badge>
              </div>
              <ul className="divide-y divide-border">
                {lvLabs.map((l) => {
                  const st = state.labs[l.id];
                  const unlocked = missionUnlocked(state, l.id);
                  return (
                    <li key={l.id}>
                      {unlocked ? (
                        <Link
                          to={`/missoes/${l.id}`}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40"
                        >
                          <MissionStatus state={state} labId={l.id} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {l.id}
                              </Badge>
                              <span className="truncate font-medium">{emp(l.t)}</span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {st?.mem ? (
                                <span className="text-success">dominada 🧠</span>
                              ) : st?.c ? (
                                <>
                                  {st.c}/{REP_TARGET} repetições
                                  {st.due && <> · próx. revisão {fmtD(st.due)}</>}
                                </>
                              ) : (
                                <>
                                  ~{l.min} min ·{" "}
                                  {st?.due ? `revisão ${fmtD(st.due)}` : "por iniciar"}
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-5 py-3 text-muted-foreground">
                          <Lock className="h-4 w-4 shrink-0" />
                          <Badge variant="outline" className="font-mono opacity-60">
                            {l.id}
                          </Badge>
                          <span className="truncate text-sm opacity-70">{emp(l.t)}</span>
                          <span className="ml-auto text-xs">conclua a anterior</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MissionStatus({ state, labId }: { state: ProgressState; labId: string }) {
  const st = state.labs[labId];
  const today = new Date().toISOString().slice(0, 10);
  if (st?.mem) return <Brain className="h-5 w-5 shrink-0 text-success" />;
  if (st?.due && st.due <= today)
    return (
      <span className="text-base" title="Revisão vencida">
        ⏰
      </span>
    );
  if (st?.c) return <CheckCircle2 className="h-5 w-5 shrink-0 text-info" />;
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px]">
      ○
    </span>
  );
}
