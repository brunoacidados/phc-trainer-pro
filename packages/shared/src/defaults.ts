/** Estado inicial de progresso (equivalente ao defaultState() do legado, sem chaves). */
import type { ProgressState, UserSettings } from "./types.ts";
import { defaultCompany } from "./company.ts";

/** Versão atual do ProgressState. v4: voz do Professor passa a Gemini por omissão. */
export const STATE_VERSION = 4;

/** Defaults de voz (v4+): Gemini TTS com a voz Charon (masculina, informativa). */
export const DEFAULT_TTS_PROVIDER = "gemini" as const;
export const DEFAULT_GM_VOICE = "Charon";
export const DEFAULT_GM_MODEL = "gemini-3.1-flash-tts-preview";

export function defaultSettings(): UserSettings {
  return {
    tts: true,
    rate: 1,
    economy: false,
    ttsProvider: DEFAULT_TTS_PROVIDER,
    gmVoice: DEFAULT_GM_VOICE,
    gmModel: DEFAULT_GM_MODEL,
    elVoice: "ErXwobaYiN019PkySvjV",
    grVoice: "troy",
    ttsFallback: true,
    freeMode: false,
  };
}

export function defaultProgress(): ProgressState {
  return {
    v: STATE_VERSION,
    labs: {},
    cards: {},
    quiz: {},
    evid: [],
    streak: { last: null, n: 0 },
    daily: { d: "", reps: 0, cards: 0, proofs: 0, lessons: 0 },
    stats: { lessons: 0, chats: 0, dict: 0, circ: 0, explics: 0 },
    achs: {},
    company: defaultCompany(),
    plan: null,
    contexto: { pais: "PT", gama: "Advanced" },
    settings: defaultSettings(),
    aiCache: {},
    dbSchema: "",
    onboarded: false,
  };
}

/**
 * Migra estado persistido (Mongo/localStorage) para a versão atual.
 * Idempotente; muta e devolve o mesmo objeto.
 *
 * v3 → v4 — "a voz do navegador dá medo": o default histórico era o TTS
 * robótico do navegador. Quem nunca escolheu explicitamente um fornecedor
 * (ttsTouched) passa para Gemini TTS com a voz Charon. Escolhas explícitas
 * (elevenlabs/groq/browser já tocados pelo aluno) são respeitadas.
 */
export function migrateState(raw: ProgressState): ProgressState {
  const s = raw ?? (defaultProgress() as ProgressState);
  const version = typeof s.v === "number" ? s.v : 3;
  if (version < 4) {
    s.settings = { ...defaultSettings(), ...(s.settings ?? {}) };
    const st = s.settings;
    if (!st.ttsTouched) {
      // "browser" era o default antigo — não dá para distinguir de uma escolha;
      // o produto decidiu: Gemini por omissão. elevenlabs/groq nunca foram
      // default, logo são escolhas conscientes e mantêm-se.
      if (st.ttsProvider === "browser" || !st.ttsProvider) st.ttsProvider = DEFAULT_TTS_PROVIDER;
      if (!st.gmVoice || st.gmVoice === "Sulafat") st.gmVoice = DEFAULT_GM_VOICE;
      if (!st.gmModel) st.gmModel = DEFAULT_GM_MODEL;
    }
    s.v = STATE_VERSION;
  }
  return s;
}
