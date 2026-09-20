import { Link } from "react-router-dom";
import { COURSES, LABS, type Course } from "@phc/content";
import { useProgress } from "../stores/progress.ts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { ProgressBar } from "../components/ui/progress.tsx";
import { buttonVariants } from "../components/ui/button.tsx";
import { cn } from "../lib/utils.ts";

function courseProgress(
  c: Course,
  state: ReturnType<typeof useProgress.getState>["state"],
): { done: number; total: number } {
  if (!state) return { done: 0, total: 0 };
  const labs = LABS.filter((l) => c.belts.includes(l.lv));
  const done = labs.filter((l) => state.labs[l.id]?.mem).length;
  return { done, total: labs.length };
}

const STATUS = {
  ativo: { label: "✅ Ativo", variant: "success" as const },
  parcial: { label: "🚧 Parcial", variant: "warning" as const },
  planeado: { label: "🗓 Em construção", variant: "muted" as const },
};

export function CursosPage() {
  const state = useProgress((s) => s.state);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🎓 Cursos por módulo</h1>
        <p className="text-sm text-muted-foreground">
          Trilhas completas por módulo PHC, entregues via web. As ativas ligam às missões; as
          restantes estão em construção (tópicos listados em cada cartão).
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {COURSES.map((c) => {
          const p = courseProgress(c, state);
          return (
            <Card key={c.id} className={cn(c.status === "planeado" && "opacity-80")}>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <CardTitle>
                  {c.icon} {c.title}
                </CardTitle>
                <Badge variant={STATUS[c.status].variant}>{STATUS[c.status].label}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{c.desc}</p>
                {c.status !== "planeado" && p.total > 0 && (
                  <>
                    <ProgressBar
                      value={(p.done / p.total) * 100}
                      label={`${p.done}/${p.total} missões dominadas`}
                    />
                    <Link
                      to="/missoes"
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                    >
                      Abrir missões →
                    </Link>
                  </>
                )}
                {c.planned.length > 0 && (
                  <div className="mt-1">
                    <b className="text-xs text-muted-foreground">Módulos planeados:</b>
                    <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                      {c.planned.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
