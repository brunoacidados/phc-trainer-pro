/** Cache IndexedDB de áudio TTS (o mesmo texto nunca gera custo 2×) — porta do VOICEIDB legado. */
import { hashStr } from "@phc/shared";

const DB_NAME = "phc-voice-v6";
const STORE = "audio";
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function audioCacheGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => resolve((rq.result as Blob) ?? null);
      rq.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function audioCacheSet(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
  } catch {
    /* quota — ignora */
  }
}

export function audioKeyFor(provider: string, voice: string, text: string, model = ""): string {
  return hashStr(`${provider}|${model}|${voice}|${text}`);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

let current: HTMLAudioElement | null = null;

export function stopAudio(): void {
  if (current) {
    current.pause();
    current = null;
  }
}

/** pede TTS ao servidor (com cache IDB) e reproduz; fallback: voz do navegador */
export async function speakCloud(
  text: string,
  provider: "gemini" | "elevenlabs" | "groq",
  voice?: string,
  model?: string,
): Promise<void> {
  const key = audioKeyFor(provider, voice || "", text, model);
  let blob = await audioCacheGet(key);
  if (!blob) {
    const { apiFetch } = await import("./api.ts");
    const r = await apiFetch<{ audio: string; mimeType: string }>("/api/ai/tts", {
      method: "POST",
      body: { text, provider, voice, model },
    });
    blob = base64ToBlob(r.audio, r.mimeType);
    await audioCacheSet(key, blob);
  }
  stopAudio();
  const url = URL.createObjectURL(blob);
  const a = new Audio(url);
  current = a;
  await new Promise<void>((resolve, reject) => {
    a.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    a.onerror = () => reject(new Error("falha ao reproduzir áudio"));
    void a.play();
  });
}

/**
 * Vozes do navegador: no Chrome a lista carrega de forma assíncrona —
 * se vier vazia, espera por `voiceschanged` (até 400 ms).
 */
function browserVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    try {
      const now = speechSynthesis.getVoices();
      if (now.length) return resolve(now);
      const t = setTimeout(done, 400);
      function done() {
        clearTimeout(t);
        speechSynthesis.removeEventListener("voiceschanged", done);
        try {
          resolve(speechSynthesis.getVoices());
        } catch {
          resolve([]);
        }
      }
      speechSynthesis.addEventListener("voiceschanged", done);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Escolhe a melhor voz PT disponível (1º pt-BR natural/online, depois pt-BR,
 * pt-PT, qualquer pt). Sem voz PT devolve null — falar português com voz
 * inglesa é precisamente a "voz que dá medo", por isso nesse caso fica em
 * silêncio (o texto continua no ecrã).
 */
function pickPtVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const natural = /natural|online|google|microsoft|premium|enhanced|neural/i;
  return (
    voices.find((v) => /^pt[-_]BR/i.test(v.lang) && natural.test(v.name)) ||
    voices.find((v) => /^pt[-_]BR/i.test(v.lang)) ||
    voices.find((v) => /^pt[-_]PT/i.test(v.lang)) ||
    voices.find((v) => /^pt/i.test(v.lang)) ||
    null
  );
}

/** voz do navegador (grátis/offline) — último recurso, robótica */
export async function speakBrowser(text: string, rate = 1): Promise<void> {
  const voices = await browserVoices();
  const pt = pickPtVoice(voices);
  if (!pt) return; // sem voz portuguesa: silêncio é melhor que susto
  return new Promise((resolve) => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = pt.lang;
      u.voice = pt;
      u.rate = rate;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}
