import { useMemo, useState } from "react";
import { BELTS, LABS, ACHIEVEMENTS, QUIZZES } from "@phc/content";
import {
  addDays,
  cardsMastered,
  currentBelt,
  fmtD,
  labsMastered,
  overallPct,
  quizzesPassed,
  todayISO,
  totalReps,
  xpTotal,
} from "@phc/shared";
import { useProgress } from "../stores/progress.ts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { ProgressBar, CircleProgress } from "../components/ui/progress.tsx";
import { Table, TBody, TD, TH, THead, TR } from "../components/ui/table.tsx";
import { Spinner, EmptyState } from "../components/ui/misc.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { cn } from "../lib/utils.ts";

export function ProgressPage() {
  const state = useProgress((s) => s.state);
  const status = useProgress((s) => s.status);
  const store = useProgress.getState;
  const [tab, setTab] = useState("visao");

  if (!state || status !== "ready") {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">📊 Progresso</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="conquistas">
            🏅 Conquistas ({Object.keys(state.achs).length}/{ACHIEVEMENTS.length})
          </TabsTrigger>
          <TabsTrigger value="provas">📸 Provas ({state.evid.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          <Overview />
        </TabsContent>
        <TabsContent value="conquistas">
          <Achievements />
        </TabsContent>
        <TabsContent value="provas">
          <Evidence
            onExport={() => exportCsv(state.evid)}
            onRemove={(i) => void store().removeEvidence(i)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- visão geral: heatmap + stats + níveis ---------- */
function Overview() {
  const state = useProgress((s) => s.state)!;

  const heatmap = useMemo(() => buildHeatmap(state), [state]);

  const stats = [
    { label: "XP total", value: xpTotal(state), icon: "⭐" },
    { label: "Sequência", value: `${state.streak.n}d`, icon: "🔥" },
    { label: "Missões 🧠", value: `${labsMastered(state)}/${LABS.length}`, icon: "🧠" },
    { label: "Repetições", value: totalReps(state), icon: "🔁" },
    { label: "Cartas dominadas", value: `${cardsMastered(state)}/139`, icon: "🃏" },
    { label: "Testes ≥80%", value: `${quizzesPassed(state)}/${QUIZZES.length}`, icon: "📝" },
    { label: "Provas", value: state.evid.length, icon: "📸" },
    { label: "Conquistas", value: Object.keys(state.achs).length, icon: "🏅" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-6">
        <CircleProgress value={overallPct(state)} size={96} />
        <div>
          <div className="text-sm text-muted-foreground">Domínio do curso</div>
          <div className="text-lg font-semibold">
            🥋 {BELTS[currentBelt(state)].name}{" "}
            <span className="text-muted-foreground">· nível {currentBelt(state)}</span>
          </div>
          <div className="text-xs text-muted-foreground">missões 70% + testes 20% + cartas 10%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-3 text-center">
              <div className="text-xl">{s.icon}</div>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🗓 Atividade (últimas 18 semanas)</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap cells={heatmap} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📈 Progresso por nível</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {BELTS.map((b) => {
            const lvLabs = LABS.filter((l) => l.lv === b.n);
            if (!lvLabs.length) return null;
            const mem = lvLabs.filter((l) => state.labs[l.id]?.mem).length;
            const started = lvLabs.filter((l) => (state.labs[l.id]?.c ?? 0) > 0).length;
            return (
              <div key={b.n}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span style={{ color: b.cor }}>🥋 {b.name}</span>
                  <span className="text-muted-foreground">
                    {mem}/{lvLabs.length} 🧠 · {started} iniciadas
                  </span>
                </div>
                <ProgressBar
                  value={(mem / lvLabs.length) * 100}
                  barClassName="bg-[var(--tw-gradient-from,#f5a623)]"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- conquistas ---------- */
function Achievements() {
  const state = useProgress((s) => s.state)!;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {ACHIEVEMENTS.map((a) => {
        const got = state.achs[a.id];
        return (
          <Card key={a.id} className={cn(!got && "opacity-45 grayscale")}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl">{a.ico}</div>
              <div className="mt-1 text-sm font-semibold">{a.t}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{a.d}</div>
              {got && (
                <Badge variant="success" className="mt-2">
                  {fmtD(got)}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- portefólio de provas ---------- */
function Evidence({ onExport, onRemove }: { onExport: () => void; onRemove: (i: number) => void }) {
  const state = useProgress((s) => s.state)!;
  if (!state.evid.length) {
    return (
      <EmptyState
        icon="📸"
        title="Ainda sem provas"
        hint="Execute missões e registe as evidências — sem evidência, não aconteceu."
      />
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onExport}>
          ⬇ Exportar CSV
        </Button>
      </div>
      <Table>
        <THead>
          <TR>
            <TH className="w-24">Data</TH>
            <TH className="w-20">Missão</TH>
            <TH className="w-24">Tipo</TH>
            <TH>Descrição</TH>
            <TH className="w-12" />
          </TR>
        </THead>
        <TBody>
          {state.evid.map((e, i) => (
            <TR key={i}>
              <TD className="text-xs text-muted-foreground">{fmtD(e.d)}</TD>
              <TD>
                <Badge variant="outline" className="font-mono">
                  {e.lab}
                </Badge>
              </TD>
              <TD>
                <Badge variant="info">{e.kind}</Badge>
              </TD>
              <TD className="text-sm">{e.txt}</TD>
              <TD>
                <button
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(i)}
                  title="Remover"
                >
                  ✕
                </button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

/* ---------- helpers ---------- */
function exportCsv(evid: { d: string; lab: string; kind: string; txt: string }[]) {
  const rows = [["Data", "Missao", "Tipo", "Descricao"]];
  for (const e of evid) rows.push([e.d, e.lab, e.kind, String(e.txt).replace(/;/g, ",")]);
  const blob = new Blob([rows.map((r) => r.join(";")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `phc-trainer-provas-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

interface Cell {
  date: string;
  count: number;
}

/** agrega atividade (repetições + provas) dos últimos 126 dias numa grelha seman×dia */
function buildHeatmap(state: ReturnType<typeof useProgress.getState>["state"]): Cell[][] {
  const counts = new Map<string, number>();
  const bump = (d?: string | null) => {
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) counts.set(d, (counts.get(d) ?? 0) + 1);
  };
  if (state) {
    for (const id in state.labs) for (const d of state.labs[id].hist ?? []) bump(d);
    for (const e of state.evid) bump(e.d);
  }
  const weeks = 18;
  const today = new Date(todayISO() + "T12:00:00");
  // alinha ao início da semana (segunda)
  const dow = (today.getDay() + 6) % 7;
  const end = addDays(todayISO(), -dow); // fim da última semana completa
  const out: Cell[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(end, -(w * 7) + d - 6);
      col.push({ date, count: counts.get(date) ?? 0 });
    }
    out.push(col);
  }
  return out;
}

function Heatmap({ cells }: { cells: Cell[][] }) {
  const level = (c: number) => (c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4);
  const COLORS = [
    "bg-secondary/60",
    "bg-primary/30",
    "bg-primary/55",
    "bg-primary/80",
    "bg-primary",
  ];
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {cells.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} ação(ões)`}
                className={cn("h-3 w-3 rounded-sm", COLORS[level(cell.count)])}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>menos</span>
        {COLORS.map((c, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-sm", c)} />
        ))}
        <span>mais</span>
      </div>
    </div>
  );
}
