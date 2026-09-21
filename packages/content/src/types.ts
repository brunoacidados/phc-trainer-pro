/** Tipos do conteúdo estático (extraído do index.html legado v5.3.0) */

export interface Belt {
  /** número do nível (0-based) */
  n: number;
  name: string;
  /** cor do cinto (hex) */
  cor: string;
  desc: string;
}

export interface LabProof {
  /** descrição da prova exigida */
  d: string;
  /** tipo: print | file | nota */
  k: string;
}

export interface LabAsk {
  q: string;
  a: string;
}

/** tipo de recurso oficial ligado a uma missão */
export type MissionLinkKind = "manual" | "video" | "doc" | "legal" | "canal";

export interface MissionLink {
  /** tipo: manual (Help Center) | video (YouTube) | doc (PDF/página oficial) | legal | canal */
  k: MissionLinkKind;
  /** título do recurso */
  t: string;
  /** URL */
  u: string;
}

export interface Lab {
  /** ex.: "L00" */
  id: string;
  /** título */
  t: string;
  /** nível/cinto (índice em BELTS) */
  lv: number;
  /** duração estimada (min) */
  min: number;
  /** meta de tempo após domínio */
  meta: string;
  /** missões pré-requisito (ids) */
  pre: string[];
  /** referência ao guia */
  ref: string;
  goal: string;
  steps: string[];
  proofs: LabProof[];
  ask: LabAsk[];
  /** recursos oficiais (Help Center, vídeos, PDFs de certificação) */
  links?: MissionLink[];
}

/** programa oficial de formação/certificação de um módulo (fonte: PHC/Cegid) */
export interface CursoOficialAula {
  t: string;
  min: number;
  missao: string;
}

export interface CursoOficial {
  intro: string;
  certificacao: { nome: string; url: string; temas: string[] };
  aulasElearning: CursoOficialAula[];
  aulasEnterprise: CursoOficialAula[];
  imobilizado: { nota: string; etapas: string[]; missao: string };
  ambitoOficial: { url: string; descritivo: string; itens: string[] };
  helpcenter: { t: string; u: string }[];
  videos: {
    t: string;
    u: string;
    dur?: string;
    canal: string;
    serie?: string;
  }[];
  canais: { t: string; u: string }[];
  pep: { nome: string; url: string; nota: string };
}

export interface MissionTheory {
  /** conceito (parágrafo de abertura) */
  c: string;
  /** conceitos-chave: [título, descrição][] */
  s: [string, string][];
  /** erros comuns */
  e: string[];
}

export interface FlashCard {
  /** frente (pergunta) */
  t: string;
  /** verso (resposta) */
  b: string;
  /** nível */
  lv: number;
  tag?: string;
}

export interface QuizQuestion {
  q: string;
  /** opções */
  o: string[];
  /** índice da opção correta */
  a: number;
  /** explicação */
  why: string;
}

export interface Quiz {
  lv: number;
  nome: string;
  qs: QuizQuestion[];
}

export interface SegmentCompany {
  nome: string;
  curto: string;
  prefixo: string;
  morada: string;
  cidade: string;
  cae: string;
  cliente: string;
  clienteCurto: string;
  fornecedor: string;
  fornecedorCurto: string;
  [key: string]: unknown;
}

export interface SegmentPlan {
  /** frase de foco do curso para o segmento */
  nota: string;
  /** missões prioritárias (ids L##) */
  destaques: string[];
}

export interface Segment {
  id: string;
  ico: string;
  nome: string;
  desc: string;
  empresa: SegmentCompany;
  phcForte?: string;
  futuro?: string;
  plano: SegmentPlan;
}

export interface GlossaryTerm {
  /** termo */
  t: string;
  /** definição */
  d: string;
  tag?: string;
  /** detalhe prático */
  pratica?: string;
}

export interface CircuitSlide {
  /** ícone */
  i: string;
  t: string;
  d: string;
  tip?: string;
}

export interface Circuit {
  id: string;
  ico: string;
  /** título */
  t: string;
  /** descrição */
  d: string;
  slides: CircuitSlide[];
}

export interface Country {
  /** PT | ES | AO | MZ | CV | PE */
  id: string;
  nome: string;
  ico: string;
  moeda: string;
  /** obrigações fiscais */
  fiscal: string[];
  /** particularidades do software */
  phc: string[];
}

export interface Encyclopedia {
  /** funções internas [nome, descrição][] */
  funcoes: [string, string][];
  /** funções Xbase/VFP */
  vfp: [string, string][];
  dicas: [string, string][];
  erros: [string, string][];
  /** tópicos de programação */
  prog: [string, string][];
  /** artigos técnicos por título */
  artigos: Record<string, [string, string][]>;
  /** índice do manual por secção (nomes de tópicos) */
  manual: Record<string, string[]>;
}

export interface SchemaHarvestEntry {
  /** nº de referências na documentação */
  n: number;
  /** campos observados */
  f: string[];
}

export interface PhcSchema {
  /** [tabela, descrição, campos][] */
  core: [string, string, string][];
  universal: string;
  conv: string[];
  harvest: Record<string, SchemaHarvestEntry>;
}

export interface Guide {
  html: string;
  /** [âncora, título][] */
  toc: [string, string][];
}

export interface Achievement {
  id: string;
  ico: string;
  /** título */
  t: string;
  /** descrição */
  d: string;
}

export interface Voices {
  elevenlabs: [string, string][];
  groq: [string, string][];
  geminiVoices: [string, string][];
  geminiModels: [string, string][];
}

export interface AiProviderDef {
  id: string;
  nome: string;
  type: "openai" | "gemini";
  url?: string;
  model: string | null;
  codeModel?: string | null;
}

export interface Prompts {
  persona: string;
  codeRole: string;
  genContract: string;
  genTipos: string[];
  genGuia: Record<string, string>;
  cheers: string[];
  tabHints: Record<string, string>;
  /** intervalos de repetição espaçada (dias) */
  ladder: number[];
  /** repetições para dominar uma missão */
  repTarget: number;
  /** repetições para dominar uma carta */
  cardTarget: number;
}

export interface SqlPrompts {
  /** as 12 regras SQL obrigatórias do responsável técnico */
  sqlRules: string;
  /** script de descoberta padrão (T-SQL) */
  discoverySql: string;
}

export type GradeNotes = Record<string, string>;
export type EncRef = Record<string, string[]>;
