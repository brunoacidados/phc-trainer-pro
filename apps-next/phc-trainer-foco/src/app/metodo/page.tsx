import type { Metadata } from "next";
import { Breadcrumbs, Disclosure, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Como funciona o método" };

/** Cada princípio: o que fazemos, porquê, e a fonte. Com nuances honestas quando a evidência é limitada. */
const PRINCIPLES: { title: string; what: string; why: string; nuance?: string; sources: string[] }[] = [
  {
    title: "Uma próxima ação de cada vez",
    what: "O ecrã Hoje mostra uma só ação principal, com o motivo. As alternativas ficam escondidas a um clique.",
    why: "Mais opções visíveis aumentam o tempo de decisão (lei de Hick) e, no TDAH, a dificuldade em iniciar tarefas. Reduzir a decisão reduz a barreira de arranque.",
    sources: ["Hick, W. E. (1952). On the rate of gain of information. Q. J. Exp. Psychology.", "Barkley, R. A. (1997). Behavioral inhibition, sustained attention, and executive functions. Psychological Bulletin, 121(1)."],
  },
  {
    title: "Missões partidas em 6 etapas",
    what: "Objetivo → Conceito → Passos → Provas → Perguntas → Fixar. Um tipo de tarefa por ecrã.",
    why: "A memória de trabalho segura cerca de 4 blocos de informação. Mostrar tudo ao mesmo tempo sobrecarrega-a — e a memória de trabalho é uma das funções executivas mais afetadas no TDAH.",
    sources: ["Cowan, N. (2001). The magical number 4 in short-term memory. Behavioral and Brain Sciences, 24(1).", "Sweller, J. (1988). Cognitive load during problem solving. Cognitive Science, 12(2).", "Martinussen, R. et al. (2005). A meta-analysis of working memory impairments in children with ADHD. JAACAP, 44(4)."],
  },
  {
    title: "Repetição espaçada (escada 1, 2, 4, 7, 14, 30, 60 dias)",
    what: "Cartas e missões voltam em intervalos crescentes. Um erro devolve a carta ao início. Repetir no mesmo dia não avança a escada.",
    why: "O efeito de espaçamento é dos resultados mais robustos da psicologia da aprendizagem: rever espaçado retém mais do que rever tudo seguido.",
    nuance: "A escada fixa é uma aproximação simples e previsível. Algoritmos adaptativos (SM-2, FSRS) ajustam o intervalo a cada pessoa e são mais eficientes — escolhemos previsibilidade porque reduz ansiedade e é fácil de explicar.",
    sources: ["Cepeda, N. J. et al. (2006). Distributed practice in verbal recall tasks. Psychological Bulletin, 132(3).", "Leitner, S. (1972). So lernt man lernen.", "Ye, J. et al. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. KDD '22."],
  },
  {
    title: "Pensar antes de ver a resposta",
    what: "Perguntas e cartas escondem a resposta até carregar em “Já pensei”.",
    why: "Tentar recordar (prática de recuperação) fortalece a memória mais do que reler.",
    sources: ["Roediger, H. L. & Karpicke, J. D. (2006). Test-enhanced learning. Psychological Science, 17(3).", "Dunlosky, J. et al. (2013). Improving students’ learning with effective learning techniques. Psychological Science in the Public Interest, 14(1)."],
  },
  {
    title: "Só é dominado o que tem prova",
    what: "“Declarar domínio” exige todas as provas e 2 repetições em dias diferentes.",
    why: "Sentir que se sabe não é o mesmo que saber: os julgamentos de aprendizagem sem teste são sistematicamente otimistas (ilusão de competência).",
    sources: ["Bjork, R. A., Dunlosky, J. & Kornell, N. (2013). Self-regulated learning: beliefs, techniques, and illusions. Annual Review of Psychology, 64."],
  },
  {
    title: "Prática deliberada",
    what: "Missões com passos concretos num PHC de treino, feedback imediato e dificuldade crescente.",
    why: "Treinar tarefas específicas no limite da capacidade, com feedback, é o que distingue prática eficaz de repetição passiva.",
    nuance: "A prática explica só parte das diferenças de desempenho entre pessoas; não prometemos que “10 000 horas” fazem um especialista.",
    sources: ["Ericsson, K. A., Krampe, R. T. & Tesch-Römer, C. (1993). The role of deliberate practice. Psychological Review, 100(3).", "Macnamara, B. N., Hambrick, D. Z. & Oswald, F. L. (2014). Deliberate practice and performance. Psychological Science, 25(8)."],
  },
  {
    title: "Exemplos resolvidos (errado → certo)",
    what: "A secção Código mostra código errado, o certo e o porquê, com uma pergunta de verificação.",
    why: "Para quem está a aprender, estudar exemplos resolvidos gasta menos memória de trabalho do que resolver do zero; comparar o errado com o certo ajuda a ver o que importa.",
    nuance: "Com a experiência, este efeito diminui (efeito de inversão da perícia). Por isso cada exemplo termina com uma checklist para aplicar sozinho.",
    sources: ["Sweller, J. & Cooper, G. A. (1985). The use of worked examples. Cognition and Instruction, 2(1).", "Kalyuga, S. et al. (2003). The expertise reversal effect. Educational Psychologist, 38(1).", "Durkin, K. & Rittle-Johnson, B. (2012). The effectiveness of using incorrect examples. Learning and Instruction, 22(3)."],
  },
  {
    title: "Meta pequena e sem sequências punitivas",
    what: "3 micro-ações por dia. Mostramos “dias ativos na semana”, não uma sequência que parte ao falhar um dia.",
    why: "Metas específicas e alcançáveis aumentam a persistência. Perder uma sequência longa tende a gerar desmotivação — e falhar dias é previsível no TDAH.",
    nuance: "A evidência sobre sequências (streaks) vem sobretudo de estudos de apps e comportamento do consumidor, não de ensaios clínicos com TDAH. É uma escolha de desenho prudente, não uma certeza.",
    sources: ["Locke, E. A. & Latham, G. P. (2002). Building a practically useful theory of goal setting. American Psychologist, 57(9).", "Fogg, B. J. (2019). Tiny Habits. Houghton Mifflin Harcourt."],
  },
  {
    title: "Tempo visível (sprint opcional)",
    what: "Na etapa 1 de cada missão pode iniciar um sprint de 10, 15 ou 25 minutos com barra visível, sem som.",
    why: "Dificuldades na perceção e gestão do tempo são frequentes no TDAH. Tornar o tempo visível ajuda a começar e a parar.",
    nuance: "Técnicas tipo Pomodoro têm pouca investigação controlada específica para TDAH; oferecemos como ferramenta opcional.",
    sources: ["Barkley, R. A. (1997). ADHD and the Nature of Self-Control. Guilford Press.", "Toplak, M. E., Dockstader, C. & Tannock, R. (2006). Temporal information processing in ADHD. Clinical Psychology Review, 26(1)."],
  },
];

export default function MethodPage() {
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { label: "Como funciona o método" }]} />
      <PageTitle
        title="Como funciona o método"
        lead="Cada decisão desta app tem um motivo. Abra só o que lhe interessar — as fontes estão no fim de cada ponto."
      />
      <div className="space-y-3">
        {PRINCIPLES.map((p) => (
          <Disclosure key={p.title} summary={p.title}>
            <div className="reading space-y-3">
              <p>
                <strong>O que fazemos: </strong>
                {p.what}
              </p>
              <p>
                <strong>Porquê: </strong>
                {p.why}
              </p>
              {p.nuance && (
                <p className="rounded-lg bg-warn-soft p-3 text-warn">
                  <strong>Nuance honesta: </strong>
                  {p.nuance}
                </p>
              )}
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                {p.sources.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </Disclosure>
        ))}
      </div>
      <p className="reading mt-8 text-sm text-ink-soft">
        Material educativo não oficial, baseado em fontes públicas da Cegid PHC. Cegid PHC® é marca dos respetivos proprietários. Esta app não substitui
        acompanhamento clínico do TDAH.
      </p>
    </div>
  );
}
