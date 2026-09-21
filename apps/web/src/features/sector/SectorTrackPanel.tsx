import { useState } from "react";
import { Link } from "react-router-dom";
import { SECTOR_PORTAS } from "@phc/content";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { cn } from "../../lib/utils.ts";

type Tab = "empresa" | "ciclo" | "produtos" | "glossario" | "nivel";

const TABS: { id: Tab; label: string }[] = [
  { id: "empresa", label: "🏢 Empresa" },
  { id: "ciclo", label: "🔄 Ciclo completo" },
  { id: "produtos", label: "📦 Produtos" },
  { id: "glossario", label: "📖 Glossário" },
  { id: "nivel", label: "🎯 Por nível" },
];

/**
 * Trilha vertical do setor "Portas & Automatismos" — empresa fictícia PORTALUSA.
 * Painel colapsável, integrado na Jornada (não é uma rota/secção separada).
 */
export function SectorTrackPanel() {
  const s = SECTOR_PORTAS;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("empresa");
  const e = s.empresa;

  return (
    <Card className="border-amber-500/40">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
          <span aria-hidden>🚪</span> Trilha do setor — Portas &amp; Automatismos
          <Badge variant="outline" className="ml-auto text-[10px] font-normal">
            {open ? "▲ ocultar" : "▼ explorar"}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Siga a <strong>{e.curto}</strong> ({e.nome}) — fabricante e comerciante de portas
          seccionais/de vidro, automatismos, grades, cais de carga e controlo de acessos — ao longo
          do <strong>ciclo completo do PHC</strong>. Empresa fictícia inspirada num perfil real do
          sector.
        </p>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  tab === t.id
                    ? "border-amber-500/60 bg-amber-500/10 font-medium text-amber-700 dark:text-amber-300"
                    : "border-border hover:border-amber-500/40",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "empresa" && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{e.descricao}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Info label="Fundada" value={String(e.fundada)} />
                <Info label="CAE" value={e.cae} />
                <Info label="Sede" value={`${e.morada}`} />
                <Info label="NIF" value={e.nif} />
              </div>
              <List label="Atividades" items={e.atividades} />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Famílias de produtos
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {e.produtosFamilias.map((f) => (
                    <div key={f.nome} className="rounded-md border border-border bg-card/60 p-2">
                      <p className="text-xs font-medium">
                        {f.nome}{" "}
                        <Badge variant="outline" className="ml-1 text-[9px]">
                          {f.origem}
                        </Badge>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{f.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
              <List label="Clientes-tipo" items={e.clientes} />
              <List label="Canais" items={e.canais} />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Mercados
                </p>
                {e.mercados.map((m) => (
                  <p key={m.tipo} className="text-xs">
                    <Badge variant="secondary" className="mr-1 text-[10px]">
                      {m.tipo}
                    </Badge>
                    {m.paises ? m.paises.join(", ") + ". " : ""}
                    {m.nota}
                  </p>
                ))}
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Departamentos → PHC
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {e.departamentos.map((d) => (
                    <div key={d.nome} className="rounded-md border border-border bg-card/60 p-2">
                      <p className="text-xs font-medium">{d.nome}</p>
                      <p className="text-[11px] text-muted-foreground">{d.funcao}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {d.phc.map((p) => (
                          <Badge key={p} variant="outline" className="text-[9px]">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.05] p-2 text-xs">
                <span className="font-medium">Parceiro/fornecedor: </span>
                {e.parceiro.nome} — {e.parceiro.papel}
              </div>
            </div>
          )}

          {tab === "ciclo" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                O percurso completo da {e.curto} no PHC, do lead à assistência pós-venda:
              </p>
              {s.ciclo.map((f, i) => (
                <div key={f.fase} className="rounded-md border border-border bg-card/60 p-2.5">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {i + 1}. {f.fase} · {f.modulo}
                  </p>
                  <p className="text-sm font-medium">{f.titulo}</p>
                  <p className="text-xs text-muted-foreground">{f.cenario}</p>
                  {f.dados.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-[11px]">
                      {f.dados.map((d) => (
                        <li key={d.k}>
                          <span className="font-medium">{d.k}:</span> {d.v}
                        </li>
                      ))}
                    </ul>
                  )}
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
                </div>
              ))}
            </div>
          )}

          {tab === "produtos" && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1 pr-2">Ref.</th>
                    <th className="py-1 pr-2">Produto</th>
                    <th className="py-1 pr-2">Origem</th>
                    <th className="py-1 pr-2">Un.</th>
                    <th className="py-1 text-right">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {s.produtos.map((p) => (
                    <tr key={p.ref} className="border-b border-border/50">
                      <td className="py-1 pr-2 font-mono text-[10px]">{p.ref}</td>
                      <td className="py-1 pr-2">{p.nome}</td>
                      <td className="py-1 pr-2">
                        <Badge variant="outline" className="text-[9px]">
                          {p.origem}
                        </Badge>
                      </td>
                      <td className="py-1 pr-2">{p.unidade}</td>
                      <td className="py-1 text-right">
                        {p.precoRef != null ? p.precoRef.toFixed(2) + " €" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "glossario" && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {s.glossario.map((g) => (
                <div key={g.t} className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-xs font-medium">{g.t}</p>
                  <p className="text-[11px] text-muted-foreground">{g.d}</p>
                  {g.phc && (
                    <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                      PHC: {g.phc}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "nivel" && (
            <div className="space-y-1.5">
              {s.porNivel.map((c) => (
                <div key={c.level} className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-xs font-semibold">
                    Nível {c.level} · {c.titulo}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{c.contexto}</p>
                  <p className="mt-0.5 text-[11px]">
                    <span className="font-medium">Tarefa: </span>
                    {c.tarefa}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/60 p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="text-xs">{value}</p>
    </div>
  );
}

function List({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <ul className="list-disc space-y-0.5 pl-4 text-xs">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
