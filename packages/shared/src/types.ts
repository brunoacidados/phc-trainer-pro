/** Estado de progresso do aluno — espelha o `S` do app legado (sem chaves de API). */

export interface LabState {
  /** repetições registadas */
  c: number;
  /** próxima revisão (ISO yyyy-mm-dd) ou null */
  due: string | null;
  /** "sei de cor" */
  mem: boolean;
  /** passos concluídos (índice → true) */
  steps: Record<string, boolean>;
  /** provas concluídas (índice → true) */
  proofs: Record<string, boolean>;
  /** datas de cada repetição */
  hist: string[];
  /** tempos cronometrados (segundos), a partir da 3ª repetição */
  timed?: number[];
}

export interface CardState {
  c: number;
  due: string | null;
}

export interface QuizState {
  /** melhor percentagem */
  best: number;
  passed: boolean;
  tries: number;
}

export interface EvidenceEntry {
  /** data ISO */
  d: string;
  lab: string;
  /** print | sql | file | oral */
  kind: string;
  txt: string;
}

export interface CompanyState {
  segId: string;
  segNome: string;
  segIco: string;
  nome: string;
  curto: string;
  prefixo: string;
  nif?: string;
  morada: string;
  cidade: string;
  cae: string;
  cliente: string;
  clienteCurto: string;
  nifCliente?: string;
  fornecedor: string;
  fornecedorCurto: string;
  nifForn?: string;
  armazem1?: string;
  armazem2?: string;
  artigos?: string[];
  necessidades?: string[];
  phcForte?: string;
  futuro?: string;
}

export interface PlanState {
  porIA?: boolean;
  /** ordem personalizada das missões (ids) */
  ordem: string[];
  destaques?: string[];
  nota?: string;
  objetivos?: string[];
  interesses?: string;
}

export type TtsProvider = "gemini" | "browser" | "elevenlabs" | "groq";

/** Definições do aluno (sem segredos — chaves de IA vivem no servidor). */
export interface UserSettings {
  tts: boolean;
  rate: number;
  economy: boolean;
  ttsProvider: TtsProvider;
  gmVoice: string;
  gmModel: string;
  elVoice: string;
  grVoice: string;
  ttsFallback: boolean;
  freeMode: boolean;
  /**
   * true quando o aluno já escolheu explicitamente uma voz/fornecedor nas
   * Definições. Sem isto, migrações de defaults (ex.: browser→gemini na v4)
   * podem aplicar-se sem pisar uma escolha consciente.
   */
  ttsTouched?: boolean;
}

export interface DailyCounters {
  d: string;
  reps: number;
  cards: number;
  proofs: number;
  lessons: number;
}

export interface ProgressState {
  v: number;
  labs: Record<string, LabState>;
  cards: Record<string, CardState>;
  quiz: Record<string, QuizState>;
  evid: EvidenceEntry[];
  streak: { last: string | null; n: number };
  daily: DailyCounters;
  stats: { lessons: number; chats: number; dict: number; circ: number; explics: number };
  /** id da conquista → data ISO de obtenção */
  achs: Record<string, string>;
  company: CompanyState;
  plan: PlanState | null;
  contexto: { pais: string; gama: string };
  settings: UserSettings;
  /** cache de explicações da IA (hash → texto) */
  aiCache: Record<string, { t: string; ts: number }>;
  /** esquema real da BD colado pelo utilizador (Gerador) */
  dbSchema: string;
  onboarded: boolean;
}

export interface ProgressSummary {
  reps: number;
  mastered: number;
  cardsMastered: number;
  quizzesPassed: number;
  evidences: number;
  streak: number;
  xp: number;
  pct: number;
  belt: number;
  lastActive: string | null;
  achievements: number;
}
