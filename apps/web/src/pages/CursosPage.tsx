import { useState } from "react";
import { Link } from "react-router-dom";
import { CONTAB_OFICIAL, COURSES, LABS, type Course } from "@phc/content";
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

/* ============ Painel do programa oficial da PHC (Contabilidade) ============ */
function ContabOficialPanel() {
  const [open, setOpen] = useState(false);
  const co = CONTAB_OFICIAL;
  const totalMin = co.aulasElearning.reduce((n, a) => n + a.min, 0);
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">
          📜 Programa oficial PHC — Contabilidade (fonte de fidelidade do curso)
        </CardTitle>
        <Badge variant="info">Certificação PHC CS Contabilidade</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{co.intro}</p>
        {/* temas da certificação */}
        <div>
          <b className="text-xs">Temas oficiais da certificação</b>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {co.certificacao.temas.map((t) => (
              <Badge key={t} variant="outline" className="text-xs font-normal">
                {t}
              </Badge>
            ))}
            <a
              href={co.certificacao.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-primary hover:underline"
            >
              📄 PDF oficial ↗
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          aria-expanded={open}
        >
          {open
            ? "▲ Ocultar aulas, manuais e vídeos"
            : "▼ Ver aulas e-learning, manuais e vídeos oficiais"}
        </button>

        {open && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* aulas e-learning */}
            <div>
              <b className="text-xs">
                Aulas e-learning oficiais — PHC Contabilidade CS ({totalMin} min + bloco Enterprise)
              </b>
              <ul className="mt-1 space-y-0.5 text-xs">
                {co.aulasElearning.map((a) => (
                  <li key={a.t} className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">{a.t}</span>
                    <span className="shrink-0 font-mono">
                      {a.min} min ·{" "}
                      <Link to={`/missoes/${a.missao}`} className="text-primary hover:underline">
                        {a.missao}
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
              <b className="mt-2 block text-xs">Bloco Enterprise (avançado)</b>
              <ul className="mt-1 space-y-0.5 text-xs">
                {co.aulasEnterprise.map((a) => (
                  <li key={a.t} className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">{a.t}</span>
                    <span className="shrink-0 font-mono">
                      {a.min} min ·{" "}
                      <Link to={`/missoes/${a.missao}`} className="text-primary hover:underline">
                        {a.missao}
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
              <b className="mt-2 block text-xs">Circuito oficial do Imobilizado</b>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {co.imobilizado.etapas.join(" → ")}{" "}
                <Link
                  to={`/missoes/${co.imobilizado.missao}`}
                  className="text-primary hover:underline"
                >
                  ({co.imobilizado.missao})
                </Link>
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                🎓 Formação oficial completa (PEP — Cegid Academy, paga, com exame):{" "}
                <a
                  href={co.pep.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline"
                >
                  programa em PDF ↗
                </a>
                . {co.pep.nota}
              </p>
            </div>

            <div className="space-y-4">
              {/* âmbito oficial */}
              <div>
                <b className="text-xs">Âmbito oficial do produto (ficha PHC)</b>
                <ul className="mt-1 grid gap-0.5 text-xs text-muted-foreground sm:grid-cols-2">
                  {co.ambitoOficial.itens.map((i) => (
                    <li key={i}>✓ {i}</li>
                  ))}
                </ul>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <a
                    href={co.ambitoOficial.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary hover:underline"
                  >
                    Ficha do produto ↗
                  </a>
                  <a
                    href={co.ambitoOficial.descritivo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary hover:underline"
                  >
                    Descritivo completo (PDF) ↗
                  </a>
                </div>
              </div>

              {/* vídeos oficiais */}
              <div>
                <b className="text-xs">🎬 Vídeos oficiais (canal Cegid PHC no YouTube)</b>
                <ul className="mt-1 space-y-0.5 text-xs">
                  {co.videos.map((v) => (
                    <li key={v.u}>
                      <a
                        href={v.u}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary hover:underline"
                      >
                        ▶ {v.t}
                      </a>
                      <span className="text-muted-foreground">
                        {" "}
                        · {v.dur} · {v.canal}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {co.canais.map((c) => (
                    <a
                      key={c.u}
                      href={c.u}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary hover:underline"
                      title={c.t}
                    >
                      📺 {c.t.split("—")[0].trim()} ↗
                    </a>
                  ))}
                </div>
              </div>

              {/* help center */}
              <div>
                <b className="text-xs">📕 Manuais oficiais — Help Center (helpcenter.phccs.net)</b>
                <ul className="mt-1 grid gap-0.5 text-xs sm:grid-cols-2">
                  {co.helpcenter.map((h) => (
                    <li key={h.u}>
                      <a
                        href={h.u}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary hover:underline"
                      >
                        {h.t} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
      <ContabOficialPanel />
    </div>
  );
}
