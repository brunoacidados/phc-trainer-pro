import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclosure, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "O método" };

/**
 * Cada técnica: o que é · como o app a aplica · o que a evidência diz (e os limites).
 * Conteúdo validado — ver docs/DOSSIE-MELHORIAS.md, secção "Validação de conceitos".
 */
const TECHNIQUES = [
  {
    title: "Recordar ativamente (retrieval practice)",
    what: "Tentar lembrar a resposta ANTES de a ver.",
    how: "Nas cartas e nas perguntas das missões a resposta está escondida até carregar em “Já pensei”.",
    evidence:
      "Testar-se fixa mais do que reler: no estudo clássico, quem se testou lembrava bastante mais uma semana depois do que quem releu (Roediger & Karpicke, 2006). A meta-análise de Dunlosky et al. (2013) classifica-a como técnica de “alta utilidade”.",
    sources: [
      { l: "Roediger & Karpicke (2006), Psychological Science", u: "https://doi.org/10.1111/j.1467-9280.2006.01693.x" },
      { l: "Dunlosky et al. (2013), Psychological Science in the Public Interest", u: "https://doi.org/10.1177/1529100612453266" },
    ],
  },
  {
    title: "Repetição espaçada",
    what: "Rever em intervalos crescentes (1, 2, 4, 7, 14, 30, 60 dias).",
    how: "O app agenda cada revisão por si. Se errar, a carta volta à primeira caixa (sistema de Leitner).",
    evidence:
      "Espaçar as revisões supera estudar tudo de uma vez (Cepeda et al., 2006, meta-análise de 317 experiências). Limite honesto: uma escada fixa é uma aproximação — algoritmos adaptativos (ex.: FSRS) ajustam o intervalo a cada pessoa e cada item.",
    sources: [
      { l: "Cepeda et al. (2006), Psychological Bulletin", u: "https://doi.org/10.1037/0033-2909.132.3.354" },
      { l: "Leitner system (visão geral)", u: "https://en.wikipedia.org/wiki/Leitner_system" },
    ],
  },
  {
    title: "Exemplos resolvidos",
    what: "Estudar um problema já resolvido, passo a passo, antes de resolver sozinho.",
    how: "Os exemplos de código mostram problema → versão frágil → versão correta → verificação.",
    evidence:
      "Para principiantes, exemplos resolvidos reduzem a carga cognitiva e aceleram a aprendizagem (Sweller & Cooper, 1985; Atkinson et al., 2000). O efeito diminui à medida que a pessoa ganha experiência — por isso as missões pedem prática real a seguir.",
    sources: [
      { l: "Atkinson, Derry, Renkl & Wortham (2000), Review of Educational Research", u: "https://doi.org/10.3102/00346543070002181" },
    ],
  },
  {
    title: "Pedaços pequenos (chunking) e um passo de cada vez",
    what: "Dividir a tarefa em partes pequenas e mostrar só a parte atual.",
    how: "Missões em 4 fases; passos mostrados um a um; teoria em frases curtas; detalhes recolhidos.",
    evidence:
      "A memória de trabalho guarda poucos elementos de cada vez (Cowan, 2001: cerca de 4). No TDAH, dificuldades de memória de trabalho são frequentes (Kasper, Alderson & Hudec, 2012). Reduzir o que está no ecrã liberta capacidade para aprender.",
    sources: [
      { l: "Cowan (2001), Behavioral and Brain Sciences", u: "https://doi.org/10.1017/S0140525X01003922" },
      { l: "Kasper, Alderson & Hudec (2012), Clinical Psychology Review", u: "https://doi.org/10.1016/j.cpr.2012.06.006" },
    ],
  },
  {
    title: "Recompensas pequenas e frequentes",
    what: "Progresso visível a cada micro-ação (pontos da meta diária, ✓ imediato).",
    how: "Meta diária pequena (3 por defeito); “dias ativos” em vez de sequência que se perde.",
    evidence:
      "No TDAH há maior aversão à espera por recompensas (Sonuga-Barke, 2003). Feedback imediato e específico está entre as intervenções com mais efeito na aprendizagem (Hattie & Timperley, 2007). Evitamos pontuações competitivas e sequências que “partem” — a vergonha de falhar é um motivo comum para abandonar.",
    sources: [
      { l: "Sonuga-Barke (2003), Neuroscience & Biobehavioral Reviews", u: "https://doi.org/10.1016/S0149-7634(03)00087-7" },
      { l: "Hattie & Timperley (2007), Review of Educational Research", u: "https://doi.org/10.3102/003465430298487" },
    ],
  },
  {
    title: "Prática deliberada com provas",
    what: "Treinar tarefas concretas, no limite da capacidade, com verificação objetiva.",
    how: "Cada missão exige provas (capturas, ficheiros) e uma meta de tempo para “dominar”.",
    evidence:
      "Ericsson et al. (1993) descreveram a prática deliberada como treino focado com feedback. Nota honesta: meta-análises posteriores (Macnamara et al., 2014) mostram que a prática explica só parte das diferenças de desempenho — importa, mas não é tudo.",
    sources: [
      { l: "Ericsson, Krampe & Tesch-Römer (1993), Psychological Review", u: "https://doi.org/10.1037/0033-295X.100.3.363" },
      { l: "Macnamara, Hambrick & Oswald (2014), Psychological Science", u: "https://doi.org/10.1177/0956797614535810" },
    ],
  },
];

export default function MethodPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Aprender", href: "/aprender" }, { label: "O método" }]} />
      <PageTitle subtitle="Seis técnicas com evidência científica. Abra só a que lhe interessar.">O método</PageTitle>
      <div className="space-y-3">
        {TECHNIQUES.map((t, i) => (
          <Disclosure key={t.title} title={`${i + 1}. ${t.title}`} defaultOpen={i === 0}>
            <dl className="prose-limit space-y-3">
              <div>
                <dt className="font-bold">O que é</dt>
                <dd>{t.what}</dd>
              </div>
              <div>
                <dt className="font-bold">Como o app aplica</dt>
                <dd>{t.how}</dd>
              </div>
              <div>
                <dt className="font-bold">O que a evidência diz</dt>
                <dd>{t.evidence}</dd>
              </div>
              <div>
                <dt className="font-bold">Fontes</dt>
                <dd>
                  <ul className="space-y-1">
                    {t.sources.map((s) => (
                      <li key={s.u}>
                        <a href={s.u} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                          {s.l} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
