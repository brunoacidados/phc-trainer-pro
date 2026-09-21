/**
 * TTS no servidor — Gemini (padrão), ElevenLabs e Groq (porta do legado v4.1).
 *
 * Gemini TTS (docs oficiais ai.google.dev/gemini-api/docs/speech-generation):
 * - devolve PCM cru (audio/L16;codec=pcm;rate=24000) → encapsulamos em WAV,
 *   senão o <audio> do navegador não reproduz e cai no fallback robótico;
 * - o modelo deteta o idioma automaticamente (PT incluído) → sem languageCode;
 * - gemini-3.1-flash-tts-preview falha aleatoriamente com 500 (~devolve tokens
 *   de texto) → a doc recomenda retry automático;
 * - se o modelo pedido não existir (404), recua para gemini-2.5-flash-preview-tts.
 */
import { ApiError } from "../lib/errors.ts";

export interface TtsResult {
  audio: string; // base64
  mimeType: string;
  provider: string;
}

export const GEMINI_DEFAULT_MODEL = "gemini-3.1-flash-tts-preview";
const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash-preview-tts";
export const GEMINI_DEFAULT_VOICE = "Charon";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** PCM 16-bit LE mono → WAV (RIFF) — o formato que os browsers reproduzem. */
export function pcmToWavBase64(pcmB64: string, rate = 24000): string {
  const pcm = Buffer.from(pcmB64, "base64");
  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0);
  hdr.writeUInt32LE(36 + pcm.length, 4);
  hdr.write("WAVE", 8);
  hdr.write("fmt ", 12);
  hdr.writeUInt32LE(16, 16); // tamanho do bloco fmt
  hdr.writeUInt16LE(1, 20); // 1 = PCM sem compressão
  hdr.writeUInt16LE(1, 22); // mono
  hdr.writeUInt32LE(rate, 24);
  hdr.writeUInt32LE(rate * 2, 28); // byte rate = rate * canais * bytes/amostra
  hdr.writeUInt16LE(2, 32); // block align
  hdr.writeUInt16LE(16, 34); // bits por amostra
  hdr.write("data", 36);
  hdr.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([hdr, pcm]).toString("base64");
}

async function geminiTtsOnce(
  key: string,
  text: string,
  voice: string,
  model: string,
): Promise<{ status: number; result?: TtsResult; errText?: string }> {
  let r: Response;
  try {
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
        }),
      },
    );
  } catch (e) {
    // rede/timeout → tratável como retry
    return { status: 599, errText: e instanceof Error ? e.message : String(e) };
  }
  if (!r.ok) return { status: r.status, errText: (await r.text()).slice(0, 200) };
  const j = (await r.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    }[];
  };
  const inline = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!inline?.data) return { status: 502, errText: "resposta sem áudio" };
  const mime = inline.mimeType || "";
  // PCM cru (audio/L16;codec=pcm;rate=24000) → WAV reproduzível no browser
  const isPcm = /pcm|l16/i.test(mime) || !/wav|mpeg|mp3|ogg|aac|webm/i.test(mime);
  const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000) || 24000;
  return {
    status: 200,
    result: {
      audio: isPcm ? pcmToWavBase64(inline.data, rate) : inline.data,
      mimeType: isPcm ? "audio/wav" : mime,
      provider: "gemini",
    },
  };
}

export async function geminiTts(
  key: string,
  text: string,
  voice = GEMINI_DEFAULT_VOICE,
  model = GEMINI_DEFAULT_MODEL,
): Promise<TtsResult> {
  const models = [model, GEMINI_FALLBACK_MODEL].filter((m, i, a) => m && a.indexOf(m) === i);
  let lastErr = "";
  for (const m of models) {
    // a doc oficial recomenda retry: o 3.1-flash-tts devolve 500 aleatório ocasionalmente
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { status, result, errText } = await geminiTtsOnce(key, text, voice, m);
      if (result) return result;
      lastErr = `Gemini TTS (${m}) HTTP ${status}: ${errText ?? ""}`.trim();
      if (status === 404 || status === 400) break; // modelo inválido → tenta o seguinte
      if (status === 401 || status === 403) throw new ApiError(502, lastErr); // chave má → não insistir
      if (status === 429 || status >= 500) {
        if (attempt < 3) await sleep(350 * attempt);
        continue;
      }
      break; // outro 4xx → não repetível
    }
  }
  throw new ApiError(502, lastErr.slice(0, 220) || "Gemini TTS: falha desconhecida");
}

export async function elevenlabsTts(
  key: string,
  text: string,
  voice = "ErXwobaYiN019PkySvjV",
): Promise<TtsResult> {
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!r.ok)
    throw new ApiError(502, `ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0, 150)}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return { audio: buf.toString("base64"), mimeType: "audio/mpeg", provider: "elevenlabs" };
}

export async function groqTts(key: string, text: string, voice = "troy"): Promise<TtsResult> {
  const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "canopylabs/orpheus-v1-english",
      voice,
      input: text,
      response_format: "mp3",
    }),
  });
  if (!r.ok)
    throw new ApiError(502, `Groq TTS HTTP ${r.status}: ${(await r.text()).slice(0, 150)}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return { audio: buf.toString("base64"), mimeType: "audio/mpeg", provider: "groq" };
}
