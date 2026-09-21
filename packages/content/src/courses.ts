/**
 * Catálogo de CURSOS por módulo PHC, entregues via web.
 * `belts` liga aos níveis existentes (BELTS) quando o curso já tem missões;
 * `planned` lista os módulos/tópicos a autorar para cursos em construção.
 */
export type CourseStatus = "ativo" | "parcial" | "planeado";

export interface Course {
  id: string;
  title: string;
  icon: string;
  desc: string;
  status: CourseStatus;
  /** níveis (BELTS) que compõem o curso quando ativo */
  belts: number[];
  /** tópicos planeados (para cursos em construção) */
  planned: string[];
}

export const COURSES: Course[] = [
  {
    id: "gestao",
    title: "Gestão (core)",
    icon: "",
    desc: "Ficheiros, vendas, compras/stocks, financeiro, fiscal e análises — o dia-a-dia do módulo Gestão.",
    status: "ativo",
    belts: [0, 1, 2, 3, 4, 5, 6],
    planned: [],
  },
  {
    id: "dev",
    title: "Desenvolvimento & Personalização",
    icon: "🛠",
    desc: "Framework PHC: eventos/regras Xbase, funções de utilizador, ecrãs personalizados (IDU) e scripts.",
    status: "ativo",
    belts: [7],
    planned: ["PHC CS Web (apps web, C#)", "API/REST web & integrações", "Webhooks & automações"],
  },
  {
    id: "projeto",
    title: "Projeto de Implementação",
    icon: "🎯",
    desc: "Implementação completa ponta-a-ponta num cenário real (capstone).",
    status: "ativo",
    belts: [8],
    planned: [],
  },
  {
    id: "contab",
    title: "Contabilidade",
    icon: "🧮",
    desc: "Alinhado à Certificação PHC CS Contabilidade: SNC e taxonomia, diários e movimentos, documentos pré-definidos, integrações Gestão↔Contab, IVA (apuramento, declaração periódica, regime de caixa, inversão do sujeito passivo), CEVMC, resultados, Modelo 22/IES, SAF-T (PT), imobilizado e fecho de ano (17 meses) — com manuais do Help Center e vídeos oficiais do canal Cegid PHC em cada missão.",
    status: "ativo",
    belts: [9],
    planned: [],
  },
  {
    id: "pessoal",
    title: "Pessoal & Vencimentos",
    icon: "🧑‍💼",
    desc: "Fichas, processamento salarial, mapas e obrigações (SS/AT).",
    status: "ativo",
    belts: [10],
    planned: [],
  },
  {
    id: "pos",
    title: "POS & Retalho",
    icon: "🛒",
    desc: "Terminal de venda, talões, fecho de caixa, grelhas e omnicanal.",
    status: "ativo",
    belts: [11],
    planned: [],
  },
  {
    id: "suporte",
    title: "Suporte & Pós-venda",
    icon: "🎧",
    desc: "PATs, instalações/equipamentos, contratos, SLA e faturação de serviço.",
    status: "ativo",
    belts: [12],
    planned: [],
  },
  {
    id: "web",
    title: "PHC Web & Mobility",
    icon: "🌐",
    desc: "Tudo o que é web: PHC CS Web, apps mobile/web, IDU web, dashboards web e PHC ON/Evolution cloud.",
    status: "parcial",
    belts: [7],
    planned: [
      "PHC CS Web — arquitetura e apps",
      "IDU/Ecrãs web avançados",
      "PHC ON / Evolution cloud (subscrição)",
      "Mobile & offline",
      "Dashboards web (PHC Dashboard)",
    ],
  },
  {
    id: "crm",
    title: "CRM & Marketing",
    icon: "🤝",
    desc: "Oportunidades, campanhas, funil de vendas e ligação ao Gestão.",
    status: "planeado",
    belts: [],
    planned: [
      "Módulo CRM completo",
      "Campanhas & email marketing",
      "Funil & previsões",
      "Integração CRM↔Gestão",
    ],
  },
  {
    id: "logistica",
    title: "Logística & Manufactor",
    icon: "🏭",
    desc: "Produção, MRP, ordens de fabrico, série/rastreabilidade e armazéns avançados.",
    status: "planeado",
    belts: [],
    planned: [
      "Manufactor (MRP/OF)",
      "Logística avançada & séries",
      "WMS/armazéns multi",
      "Planeamento de produção",
    ],
  },
  {
    id: "digital",
    title: "Ignios & Ecossistema Digital",
    icon: "✨",
    desc: "Ignios (preenchimento automático), EyePeak, Cegid Docs, open banking e IA Cegid Pulse.",
    status: "planeado",
    belts: [],
    planned: [
      "Ignios (auto-preenchimento)",
      "EyePeak (sincronização e-commerce)",
      "Cegid Docs & File Storage",
      "Open banking & pagamentos",
      "Cegid Pulse (IA)",
    ],
  },
] as Course[];
