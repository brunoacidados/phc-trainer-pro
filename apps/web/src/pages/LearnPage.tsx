import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, ChevronLeft, ChevronRight, Search, Volume2 } from "lucide-react";
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
  const [showAdv, setShowAdv] = useState(false);

  const tables = useMemo(() => {
    const t = detectTables(`${desc} ${ecra}`);
    for (const x of meta?.tabelas ?? []) if (!t.includes(x)) t.push(x);
    return t;
  }, [desc, ecra, meta]);
  const script = useMemo(() => buildDiscovery(tables.length ? tables : undefined), [tables]);

  const conf = meta?.conf ?? null;
  const needsDisc =
    !!out && (meta?.estado === "precisa_descoberta" || (conf !== null && conf < 99));
  const step = !out ? 1 : needsDisc ? 2 : 3;

  const EXAMPLES = [
    "Quero ver os últimos 10 registos da faturação (ft) e as tabelas ligadas",
    "Evento ao gravar um cliente que valida o NIF e avisa se faltar",
    "Consulta SQL: vendas por cliente no último mês com total e IVA",
    "Regra que impede desconto > 20% sem autorização",
  ];

  async function generate() {
    if (!desc.trim()) {
      toast.info("Descreva primeiro, em linguagem simples, o que quer fazer.");
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
      toast.info("Cole primeiro os resultados do script.");
      return;
    }
    const msgs: ThreadMsg[] = [
      ...thread,
      {
        role: "user",
        content:
          `RESULTADOS DO SCRIPT DE DESCOBERTA (esquema REAL da BD — AUTORIDADE MÁXIMA):\n${results.slice(0, 12000)}\n\n` +
          "Reavalia a fila de pendentes. Se confiança >=99%, entrega a solução FINAL completa. Senão, diz exatamente que queries faltam. Termina com ===META=== atualizado.",
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
      await store().syncFull({
        dbSchema:
          `${(state?.dbSchema ?? "").trim()}\n\n## descoberta ${new Date().toISOString().slice(0, 10)}\n${results.slice(0, 4000)}`
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
      {/* indicador de passos */}
      <div className="flex items-center gap-2 text-xs">
        {["1 · Descrever", "2 · Verificar BD (se preciso)", "3 · Código final"].map((s2, i) => (
          <span
            key={s2}
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              step === i + 1
                ? "bg-primary text-primary-foreground"
                : step > i + 1
                  ? "bg-success/20 text-success"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {s2}
          </span>
        ))}
      </div>

      {/* PASSO 1 */}
      <Card>
        <CardHeader>
          <CardTitle>🧰 O que quer fazer?</CardTitle>
          <p className="text-xs text-muted-foreground">
            Escreva como se estivesse a pedir a um colega. Não precisa de saber nomes de tabelas — a
            app descobre-as.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="cursor-pointer rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                onClick={() => setDesc(ex)}
              >
                {ex.slice(0, 44)}…
              </button>
            ))}
          </div>
          <Textarea
            rows={4}
            placeholder="Ex.: quero um relatório das vendas por cliente no último mês…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button
            className="text-xs text-info hover:underline"
            onClick={() => setShowAdv((v) => !v)}
          >
            {showAdv ? "− menos opções" : "+ opções avançadas (tipo de artefato, ecrã/tabela)"}
          </button>
          {showAdv && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Tipo de artefato</label>
                <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {PROMPTS.genTipos.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ecrã/tabela alvo (opcional)</label>
                <Input
                  value={ecra}
                  onChange={(e) => setEcra(e.target.value)}
                  placeholder="ex.: Clientes, ft…"
                />
              </div>
            </div>
          )}
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
          <Button loading={ai.loading} onClick={() => void generate()}>
            ⚡ Gerar
          </Button>
        </CardContent>
      </Card>

      {/* PASSO 2 (só se precisar de descobrir a BD) */}
      {needsDisc && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="text-warning">🔎 Passo 2: ver a sua base de dados</CardTitle>
            <p className="text-xs text-muted-foreground">
              Para não inventar nomes, a IA precisa de ver o esquema REAL. É rápido: copie o script,
              corra no PHC (Supervisor → Simulador de SQL) ou no SSMS, e cole aqui o resultado.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {conf !== null && (
              <div className="flex items-center gap-3">
                <CircleProgress value={conf} size={64} label={`${conf}%`} />
                <p className="text-xs text-muted-foreground">
                  Confiança atual. Abaixo de 99% a IA ainda não entrega código final.
                </p>
              </div>
            )}
            {!!meta?.pend?.length && (
              <div>
                <b className="text-xs">Falta confirmar:</b>
                <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                  {meta.pend.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            <pre className="max-h-48 overflow-auto rounded-md border border-border bg-[#0d1117] p-3 text-[12px] text-success">
              {script}
            </pre>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(script);
                  toast.success("Script copiado!");
                }}
              >
                Copiar script
              </Button>
            </div>
            <Textarea
              rows={5}
              placeholder="Cole aqui o resultado que o PHC/SSMS devolveu…"
              value={results}
              onChange={(e) => setResults(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                loading={ai.loading}
                disabled={!results.trim()}
                onClick={() => void sendResults()}
              >
                🔁 Enviar e continuar
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!results.trim()) return toast.info("Nada para guardar.");
                  await store().syncFull({
                    dbSchema:
                      `${(state?.dbSchema ?? "").trim()}\n\n## esquema ${new Date().toISOString().slice(0, 10)}\n${results.slice(0, 6000)}`
                        .trim()
                        .slice(-24000),
                  });
                  setResults("");
                  toast.success("Guardado em 'O meu esquema' — próximos pedidos já partem daqui.");
                }}
              >
                💾 Guardar no meu esquema
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PASSO 3: resultado */}
      {out && (
        <Card className="border-success/40">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-success">
              ✅ Resultado (ronda {round} · {prov})
            </CardTitle>
            {conf !== null && (
              <Badge variant={conf >= 99 ? "success" : "warning"}>{conf}% confiança</Badge>
            )}
          </CardHeader>
          <CardContent>
            <GenOutput text={stripMeta(out)} />
          </CardContent>
        </Card>
      )}
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
        <b>Tudo à distância de 1 clique.</b> Estes ficheiros são servidos pela própria app
        (funcionam offline depois da 1ª visita). O estudo de cartas já é <b>nativo</b> em 🧠
        Praticar — não precisa do Anki externo.
      </Alert>
      <div className="grid gap-3 md:grid-cols-2">
        {itens.map((it) => (
          <Card key={it.t}>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="text-2xl">{it.ico}</span>
              <div className="min-w-0 flex-1">
                <b className="text-sm">{it.t}</b>
                <p className="mt-0.5 text-xs text-muted-foreground">{it.d}</p>
                <a
                  href={it.href}
                  download
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-2")}
                >
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
                {installed
                  ? "Já instalada neste dispositivo. ✅"
                  : "Adicione ao ecrã inicial / instale no computador para uso offline."}
              </p>
              {canInstall && !installed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => void promptInstall()}
                >
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
