import { Link } from "react-router-dom";
import { sectorCaseForLevel, sectorPhasesForMission, type Lab } from "@phc/content";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";
import { Badge } from "../../components/ui/badge.tsx";

/**
 * Caso prático do setor "Portas & Automatismos" (empresa fictícia PORTALUSA)
 * ligado à missão/nível atual. Aparece inline no detalhe da missão.
 */
export function SectorCaseInline({ lab }: { lab: Lab }) {
  const levelCase = sectorCaseForLevel(lab.lv);
  const phases = sectorPhasesForMission(lab.id);
  if (!levelCase && phases.length === 0) return null;

  return (
    <Card className="border-amber-500/40 bg-amber-500/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
          <span aria-hidden>🚪</span> Caso do setor — PORTALUSA
          <Badge variant="outline" className="ml-auto text-[10px] font-normal">
            Portas &amp; Automatismos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {levelCase && (
          <div className="space-y-1">
            <p className="font-medium">{levelCase.titulo}</p>
            <p className="text-muted-foreground">{levelCase.contexto}</p>
            <p className="rounded-md border border-amber-500/30 bg-background/60 p-2">
              <span className="font-medium">🎯 Tarefa no setor: </span>
              {levelCase.tarefa}
            </p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {levelCase.phc.map((p) => (
                <Badge key={p} variant="secondary" className="text-[10px]">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {phases.map((f) => (
          <div key={f.fase} className="rounded-md border border-border bg-card/60 p-2.5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {f.fase} · {f.modulo}
            </p>
            <p className="mt-0.5 font-medium">{f.titulo}</p>
            <p className="text-xs text-muted-foreground">{f.cenario}</p>
            {f.dados.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs">
                {f.dados.map((d) => (
                  <li key={d.k}>
                    <span className="font-medium">{d.k}:</span> {d.v}
                  </li>
                ))}
              </ul>
            )}
            {f.missoes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {f.missoes.map((m) => (
                  <Link
                    key={m}
                    to={`/missoes/${m}`}
                    className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] hover:border-primary/50 hover:text-primary"
                  >
                    {m}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
