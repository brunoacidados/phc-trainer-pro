import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, ChevronLeft, ChevronRight, Copy, Search, Volume2 } from "lucide-react";
import { CIRCUITS, ENCYCLOPEDIA, GLOSSARY, GUIDE, PROMPTS, SQL_PROMPTS } from "@phc/content";
import {
  applyCompanyText,
  buildDiscovery,
  detectTables,
  encSearchAll,
  parseMeta,
  schemaContext,
  stripMeta,
  type GenMeta,
} from "@phc/shared";
import { useProgress } from "../stores/progress.ts";
import { useAi } from "../hooks/useAi.ts";
import { useTts } from "../hooks/useTts.ts";
import { toast } from "../components/ui/toast.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input, Select, Textarea } from "../components/ui/input.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx";
import { EmptyState } from "../components/ui/misc.tsx";
import { Alert } from "../components/ui/alert.tsx";
import { CircleProgress } from "../components/ui/progress.tsx";
import { cn } from "../lib/utils.ts";
import { ProtocolTab } from "../features/learn/ProtocolTab.tsx";
import { usePwaInstall } from "../hooks/usePwaInstall.ts";
import { buttonVariants } from "../components/ui/button.tsx";

export function LearnPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "circuitos";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">📚 Aprender</h1>
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="circuitos">🔄 Circuitos</TabsTrigger>
          <TabsTrigger value="dicionario">📖 Dicionário</TabsTrigger>
          <TabsTrigger value="enciclopedia">📕 Enciclopédia</TabsTrigger>
          <TabsTrigger value="guia">📚 Guia completo</TabsTrigger>
          <TabsTrigger value="gerador">🧰 Gerador de código</TabsTrigger>
          <TabsTrigger value="protocolo">📜 Protocolo</TabsTrigger>
          <TabsTrigger value="recursos">📥 Recursos</TabsTrigger>
        </TabsList>
        <TabsContent value="circuitos">
          <CircuitosTab />
        </TabsContent>
        <TabsContent value="dicionario">
          <DicionarioTab />
        </TabsContent>
        <TabsContent value="enciclopedia">
          <EnciclopediaTab initialQuery={params.get("q") ?? ""} />
        </TabsContent>
        <TabsContent value="guia">
          <GuiaTab />
        </TabsContent>
        <TabsContent value="gerador">
          <GeradorTab />
        </TabsContent>
        <TabsContent value="protocolo">
          <ProtocolTab />
        </TabsContent>
        <TabsContent value="recursos">
          <RecursosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============ Circuitos ============ */
function CircuitosTab() {
  const [sel, setSel] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const tts = useTts();
  const ai = useAi();
  const state = useProgress((s) => s.state);
  const [exp, setExp] = useState<string | null>(null);
  const circuit = CIRCUITS.find((c) => c.id === sel);

  if (circuit) {
    const slide = circuit.slides[i];
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>
            {circuit.ico} {circuit.t} — passo {i + 1}/{circuit.slides.length}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSel(null);
              setI(0);
              setExp(null);
            }}
          >
            ✖ sair
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/40 p-5">
            <div className="text-3xl">{slide.i}</div>
            <h3 className="mt-2 text-lg font-semibold text-accent">{slide.t}</h3>
            <p className="mt-1 text-sm leading-relaxed">
              {state ? applyCompanyText(slide.d, state.company) : slide.d}
            </p>
            {slide.tip && <p className="mt-2 text-xs text-info">💡 {slide.tip}</p>}
          </div>
          {exp && (
            <p className="whitespace-pre-wrap rounded-md bg-secondary/60 p-3 text-sm">{exp}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={i === 0}
              onClick={() => {
                setI(i - 1);
                setExp(null);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={i >= circuit.slides.length - 1}
              onClick={() => {
                setI(i + 1);
                setExp(null);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void tts.speak(`${slide.t}. ${slide.d}`)}
            >
              <Volume2 className="h-4 w-4" /> Ouvir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={ai.loading}
              onClick={async () => {
                try {
                  const r = await ai.explain(`${slide.t}: ${slide.d}`, `circuito ${circuit.t}`);
                  setExp(r);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <Brain className="h-4 w-4" /> Explicar
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {i + 1}/{circuit.slides.length}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CIRCUITS.map((c) => (
        <button
          key={c.id}
          className="cursor-pointer text-left"
          onClick={() => {
            setSel(c.id);
            setI(0);
          }}
        >
          <Card className="h-full transition-colors hover:border-primary/60">
            <CardContent className="p-4">
              <div className="text-2xl">{c.ico}</div>
              <h3 className="mt-1 font-semibold text-accent">{c.t}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
              <Badge variant="muted" className="mt-2">
                {c.slides.length} passos
              </Badge>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

/* ============ Dicionário ============ */
function DicionarioTab() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("Todos");
  const [open, setOpen] = useState<number | null>(null);
  const [aiTxt, setAiTxt] = useState<Record<number, string>>({});
  const ai = useAi();
  const tts = useTts();

  const tags = useMemo(
    () => ["Todos", ...Array.from(new Set(GLOSSARY.map((g) => g.tag).filter(Boolean) as string[]))],
    [],
  );
  const hits = useMemo(() => {
    const low = q.toLowerCase();
    return GLOSSARY.filter(
      (g) =>
        (tag === "Todos" || g.tag === tag) &&
        (!low || g.t.toLowerCase().includes(low) || g.d.toLowerCase().includes(low)),
    );
  }, [q, tag]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Pesquisar 94 termos (ATCUD, SAF-T, PCMP…)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select className="w-44" value={tag} onChange={(e) => setTag(e.target.value)}>
          {tags.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {hits.map((g, i) => (
          <Card key={g.t} className={cn(open === i && "border-primary/50")}>
            <CardContent className="p-4">
              <button
                className="w-full cursor-pointer text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm text-accent">{g.t}</b>
                  {g.tag && <Badge variant="muted">{g.tag}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {open === i ? g.d : g.d.slice(0, 110) + (g.d.length > 110 ? "…" : "")}
                </p>
              </button>
              {open === i && (
                <div className="mt-2 flex gap-1 border-t border-border pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void tts.speak(`${g.t}. ${g.d}`)}
                  >
                    <Volume2 className="h-3 w-3" /> Ouvir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={ai.loading}
                    onClick={async () => {
                      try {
                        const r = await ai.explain(`${g.t}: ${g.d}`, g.t);
                        setAiTxt((m) => ({ ...m, [i]: r }));
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    <Brain className="h-3 w-3" /> Professor
                  </Button>
                  {aiTxt[i] && (
                    <p className="mt-1 w-full rounded bg-secondary/60 p-2 text-xs">{aiTxt[i]}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {!hits.length && (
        <EmptyState
          icon="📖"
          title="Nenhum termo encontrado"
          hint="Tente outra palavra ou remova filtros."
        />
      )}
    </div>
  );
}

/* ============ Enciclopédia ============ */
const ENC_SECTIONS = [
  { id: "funcoes", label: `Funções internas (${ENCYCLOPEDIA.funcoes.length})` },
  { id: "vfp", label: `Xbase/VFP (${ENCYCLOPEDIA.vfp.length})` },
  { id: "dicas", label: `Dicas (${ENCYCLOPEDIA.dicas.length})` },
  { id: "erros", label: `Erros comuns (${ENCYCLOPEDIA.erros.length})` },
  { id: "prog", label: `Programação (${ENCYCLOPEDIA.prog.length})` },
] as const;

function EnciclopediaTab({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [section, setSection] = useState<string>("funcoes");
  const [open, setOpen] = useState<string | null>(null);
  const ai = useAi();
  const [aiTxt, setAiTxt] = useState<Record<string, string>>({});

  const results = useMemo(() => (q.trim().length >= 2 ? encSearchAll(q.trim()) : []), [q]);
  const rows: { n: string; d: string; tag?: string }[] =
    q.trim().length >= 2
      ? results.map((r) => ({ n: r.n, d: r.d, tag: r.tag }))
      : (
          ENCYCLOPEDIA[section as "funcoes" | "vfp" | "dicas" | "erros" | "prog"] as [
            string,
            string,
          ][]
        ).map(([n, d]) => ({ n, d }));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Pesquisa global — cruza funções, Xbase, dicas, erros, artigos e manual (3.966 tópicos destilados)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {!q && (
        <Tabs value={section} onValueChange={setSection}>
          <TabsList>
            {ENC_SECTIONS.map((s) => (
              <TabsTrigger key={s.id} value={s.id}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {q && (
        <p className="text-xs text-muted-foreground">
          {results.length} resultados para “{q}”
        </p>
      )}
      <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
        {rows.slice(0, 300).map(({ n, d, tag }, i) => {
          const key = `${q}-${section}-${i}`;
          return (
            <div key={key} className="rounded-md border border-border bg-card px-3 py-2">
              <button
                className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                onClick={() => setOpen(open === key ? null : key)}
              >
                <span className="text-sm font-medium text-accent">
                  {tag && (
                    <Badge variant="muted" className="mr-2">
                      {tag}
                    </Badge>
                  )}
                  {n}
                </span>
              </button>
              {open === key && (
                <div className="mt-1 space-y-2">
                  <p className="whitespace-pre-wrap text-xs text-muted-foreground">{d}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={ai.loading}
                    onClick={async () => {
                      try {
                        const r = await ai.explain(`${n}: ${d}`, n);
                        setAiTxt((m) => ({ ...m, [key]: r }));
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    <Brain className="h-3 w-3" /> Perguntar ao Professor
                  </Button>
                  {aiTxt[key] && (
                    <p className="rounded bg-secondary/60 p-2 text-xs">{aiTxt[key]}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        📕 Índice destilado da Enciclopédia PHC oficial — descrições resumidas/reescritas com
        atribuição à Cegid/PHC.
      </p>
    </div>
  );
}

/* ============ Guia ============ */
function GuiaTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav className="h-fit space-y-1 rounded-lg border border-border bg-card p-3 lg:sticky lg:top-32">
        {GUIDE.toc.map(([anchor, title]) => (
          <a
            key={anchor}
            href={`#${anchor}`}
            className="block rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {title}
          </a>
        ))}
      </nav>
      <div
        className="prose-phc max-w-none text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: GUIDE.html }}
      />
    </div>
  );
}

/* ============ Gerador de código (descoberta guiada v5.3 portada) ============ */
interface ThreadMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

function GeradorTab() {
  const state = useProgress((s) => s.state);
  const store = useProgress.getState;
  const ai = useAi();

  const [tipo, setTipo] = useState(PROMPTS.genTipos[0]);
  const [ecra, setEcra] = useState("");
  const [desc, setDesc] = useState("");
  const [results, setResults] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [meta, setMeta] = useState<GenMeta | null>(null);
  const [prov, setProv] = useState("");
  const [round, setRound] = useState(0);
  const [thread, setThread] = useState<ThreadMsg[]>([]);

  const tables = useMemo(() => {
    const t = detectTables(`${desc} ${ecra}`);
    for (const x of meta?.tabelas ?? []) if (!t.includes(x)) t.push(x);
    return t;
  }, [desc, ecra, meta]);
  const script = useMemo(() => buildDiscovery(tables.length ? tables : undefined), [tables]);

  const conf = meta?.conf ?? null;
  const showDisc = !!out && (meta?.estado === "precisa_descoberta" || (conf !== null && conf < 99));

  async function generate() {
    if (!desc.trim()) {
      toast.info("Descreva o problema/requisito.");
      return;
    }
    const usr =
      `ARTEFATO PEDIDO: ${tipo}\nECRÃ/TABELA ALVO: ${ecra || "(não indicado)"}\nTABELAS DETETADAS NO PEDIDO: ${tables.join(", ") || "(nenhuma explícita)"}\n` +
      `GUIA TÉCNICO DO ARTEFATO: ${PROMPTS.genGuia[tipo] ?? ""}\nPROBLEMA/REQUISITO DO TÉCNICO: ${desc}\n\n` +
      `${SQL_PROMPTS.sqlRules}\n\n${schemaContext(`${desc} ${ecra} ${tipo}`, state?.dbSchema)}\n\n` +
      "Começa pela FASE 1 do contrato: avalia o que sabes vs o que precisas de descobrir sobre esta BD e responde em conformidade.\n\n" +
      `${PROMPTS.codeRole}\n\n${PROMPTS.genContract}`;
    const msgs: ThreadMsg[] = [{ role: "user", content: usr }];
    try {
      const r = await ai.chat({ kind: "generate", code: true, maxTokens: 1800, messages: msgs });
      msgs.push({ role: "assistant", content: r.text });
      setThread(msgs);
      setOut(r.text);
      setMeta(parseMeta(r.text));
      setProv(r.provider);
      setRound(1);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function sendResults() {
    if (!results.trim()) {
      toast.info("Cole primeiro os resultados do script de descoberta.");
      return;
    }
    const msgs: ThreadMsg[] = [
      ...thread,
      {
        role: "user",
        content:
          `RESULTADOS DO SCRIPT DE DESCOBERTA (esquema REAL da BD — AUTORIDADE MÁXIMA, prevalece sobre a KB):\n${results.slice(0, 12000)}\n\n` +
          "Reavalia a fila de pendentes. Se atingiste confiança >=99%, entrega a solução FINAL completa no formato definido. " +
          "Se ainda faltar algo, indica exatamente que queries adicionais devo correr. Termina com o bloco ===META=== atualizado.",
      },
    ];
    try {
      const r = await ai.chat({ kind: "generate", code: true, maxTokens: 1800, messages: msgs });
      msgs.push({ role: "assistant", content: r.text });
      setThread(msgs);
      setOut(r.text);
      setMeta(parseMeta(r.text));
      setProv(r.provider);
      setRound((n) => n + 1);
      // acumular no esquema do utilizador
      await store().syncFull({
        dbSchema:
          `${(state?.dbSchema ?? "").trim()}\n\n## descoberta ${new Date().toISOString().slice(0, 10)} — tabelas: ${tables.join(", ") || "-"}\n${results.slice(0, 4000)}`
            .trim()
            .slice(-24000),
      });
      setResults("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🧰 Gerador de código PHC — descoberta guiada + confiança real</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            (1) descreva o pedido → (2) a IA declara o que falta e a app gera um script de
            descoberta sob medida → (3) corra no Simulador de SQL/SSMS e cole os resultados → (4)
            código final só com ≥99% de confiança contra o esquema REAL. Código com prioridade para
            modelos de código (glm-5.3/codestral) — routing no servidor.
          </p>
          <div>
            <label className="text-xs text-muted-foreground">Tipo de artefato:</label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {PROMPTS.genTipos.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Ecrã/tabela alvo (ex.: Clientes, ft):
            </label>
            <Input value={ecra} onChange={(e) => setEcra(e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Descreva o problema/requisito:</label>
            <Textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex.: quero ver os últimos 10 registos na ft e as suas tabelas relacionadas — não sei quais são nem os campos de ligação"
            />
          </div>
          {tables.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tabelas detetadas:{" "}
              {tables.map((t) => (
                <Badge key={t} variant="info" className="ml-1">
                  {t}
                </Badge>
              ))}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void generate()} loading={ai.loading}>
              ⚡ Gerar (descoberta guiada)
            </Button>
            {out && (
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(stripMeta(out));
                  toast.success("Resposta copiada.");
                }}
              >
                <Copy className="h-4 w-4" /> Copiar resposta
              </Button>
            )}
            {out && (
              <span className="self-center text-xs text-muted-foreground">
                ronda {round} · via {prov}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {out && (
        <Card className="border-info/40">
          <CardHeader>
            <CardTitle className="text-info">✅ Resposta da IA (ronda {round})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <CircleProgress value={conf ?? 0} label={conf === null ? "?" : `${conf}%`} />
              <div className="space-y-1">
                {meta?.estado && (
                  <Badge variant={meta.estado === "pronto" ? "success" : "warning"}>
                    {meta.estado === "pronto" ? "✔ estado: pronto" : "🔎 precisa de descoberta"}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  Confiança REAL declarada pelo modelo (desconta cada campo/relação não confirmada).
                </p>
              </div>
            </div>
            {!!meta?.pend?.length && (
              <div>
                <b className="text-sm">📋 Fila pendente de validação ({meta.pend.length}):</b>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {meta.pend.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <GenOutput text={stripMeta(out)} />
          </CardContent>
        </Card>
      )}

      {(showDisc || !out) && (
        <Card>
          <CardHeader>
            <CardTitle>
              🔎 Script de descoberta (sob medida: {tables.join(", ") || "ft, cl"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Corra no <b>Supervisor → Simulador de SQL</b> (ou SSMS) e cole os resultados abaixo.
              Inclui: tabela interna <b>dic</b>, colunas, campos <b>u_*</b>, FKs, 1 linha de amostra
              por tabela, stored procedures, views e jobs.
            </p>
            <pre className="max-h-64 overflow-auto rounded-md border border-border bg-[#0e1526] p-3 text-xs text-success">
              {script}
            </pre>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(script);
                toast.success("Script copiado!");
              }}
            >
              <Copy className="h-3 w-3" /> Copiar script
            </Button>
            <Textarea
              rows={6}
              value={results}
              onChange={(e) => setResults(e.target.value)}
              placeholder="Cole aqui os resultados do script (pode colar tudo, tal como saiu)…"
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={!out} loading={ai.loading} onClick={() => void sendResults()}>
                🔁 Enviar resultados e continuar
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!results.trim()) {
                    toast.info("Nada para guardar.");
                    return;
                  }
                  await store().syncFull({
                    dbSchema:
                      `${(state?.dbSchema ?? "").trim()}\n\n## esquema guardado ${new Date().toISOString().slice(0, 10)}\n${results.slice(0, 6000)}`
                        .trim()
                        .slice(-24000),
                  });
                  setResults("");
                  toast.success("Guardado em '📐 O meu esquema'.");
                }}
              >
                💾 Guardar no meu esquema
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            📐 O meu esquema (guardado na sua conta, injetado em todos os pedidos)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            rows={5}
            value={state?.dbSchema ?? ""}
            onChange={(e) => void store().syncFull({ dbSchema: e.target.value.slice(0, 24000) })}
            placeholder="Resultados de descoberta colados aparecem aqui; também pode colar/editar manualmente…"
          />
          {state?.dbSchema ? (
            <Badge variant="success">
              ✔ {state.dbSchema.length} caracteres — AUTORIDADE MÁXIMA nos prompts
            </Badge>
          ) : (
            <Badge variant="muted">
              sem esquema colado — a IA usa a KB documentada e marca pressupostos
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GenOutput({ text }: { text: string }) {
  const parts = text.split("```");
  return (
    <div className="space-y-2 text-sm">
      {parts.map((pt, i) =>
        i % 2 === 1 ? (
          <div key={i} className="relative">
            <pre className="overflow-auto rounded-md border border-border bg-[#0e1526] p-3 text-xs text-success">
              {pt.replace(/^[a-zA-Z0-9_+-]*\n/, "")}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-2 top-2"
              onClick={() => {
                navigator.clipboard.writeText(pt.replace(/^[a-zA-Z0-9_+-]*\n/, ""));
                toast.success("Código copiado!");
              }}
            >
              📋
            </Button>
          </div>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {pt}
          </p>
        ),
      )}
    </div>
  );
}


/* ============ Recursos / Downloads (acesso fácil aos ficheiros) ============ */
function RecursosTab() {
  const { canInstall, promptInstall, installed } = usePwaInstall();
  const itens = [
    {
      ico: "📄",
      t: "Guia do Técnico Expert (Markdown)",
      d: "O guia completo de 15 capítulos em .md para ler offline / no seu editor.",
      href: "/guia-expert-phc-gestao-evolution.md",
      btn: "⬇ Baixar .md",
    },
    {
      ico: "🃏",
      t: "Flashcards PHC (CSV p/ Anki)",
      d: "As 139 cartas em CSV (separador ;). Só precisa disto se quiser o Anki EXTERNO — na app já é nativo.",
      href: "/flashcards-phc.csv",
      btn: "⬇ Baixar .csv",
    },
    {
      ico: "🎧",
      t: "Boas-vindas do Professor (áudio)",
      d: "Mensagem de boas-vindas em pt-BR.",
      href: "/audio/bemvindo.mp3",
      btn: "⬇ Baixar .mp3",
    },
  ];
  return (
    <div className="space-y-4">
      <Alert variant="info">
        <b>Tudo à distância de 1 clique.</b> Estes ficheiros são servidos pela própria app (funcionam
        offline depois da 1ª visita). O estudo de cartas já é <b>nativo</b> em 🧠 Praticar — não precisa
        do Anki externo.
      </Alert>
      <div className="grid gap-3 md:grid-cols-2">
        {itens.map((it) => (
          <Card key={it.t}>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="text-2xl">{it.ico}</span>
              <div className="min-w-0 flex-1">
                <b className="text-sm">{it.t}</b>
                <p className="mt-0.5 text-xs text-muted-foreground">{it.d}</p>
                <a href={it.href} download className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-2")}>
                  {it.btn}
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <span className="text-2xl">📱</span>
            <div className="min-w-0 flex-1">
              <b className="text-sm">Instalar a app (PWA)</b>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {installed ? "Já instalada neste dispositivo. ✅" : "Adicione ao ecrã inicial / instale no computador para uso offline."}
              </p>
              {canInstall && !installed && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => void promptInstall()}>
                  ⬇ Instalar app
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
