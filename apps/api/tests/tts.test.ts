import { afterEach, describe, expect, it, vi } from "vitest";
import { GEMINI_DEFAULT_VOICE, geminiTts, pcmToWavBase64 } from "../src/services/tts.ts";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as globalThis.Response;
}

function geminiAudio(dataB64: string, mimeType = "audio/L16;codec=pcm;rate=24000") {
  return jsonResponse({
    candidates: [{ content: { parts: [{ inlineData: { mimeType, data: dataB64 } }] } }],
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pcmToWavBase64", () => {
  it("encapsula PCM em WAV com cabeçalho RIFF correto (24 kHz mono 16-bit)", () => {
    const pcm = Buffer.from([1, 2, 3, 4]);
    const wav = Buffer.from(pcmToWavBase64(pcm.toString("base64"), 24000), "base64");
    expect(wav.subarray(0, 4).toString()).toBe("RIFF");
    expect(wav.readUInt32LE(4)).toBe(36 + pcm.length);
    expect(wav.subarray(8, 12).toString()).toBe("WAVE");
    expect(wav.readUInt32LE(24)).toBe(24000); // sample rate
    expect(wav.readUInt16LE(34)).toBe(16); // bits por amostra
    expect(wav.readUInt32LE(40)).toBe(pcm.length);
    expect(wav.subarray(44)).toEqual(pcm);
  });
});

describe("geminiTts", () => {
  it("converte PCM cru (audio/L16) em WAV reproduzível no browser", async () => {
    const pcm = Buffer.from([9, 8, 7, 6]);
    const fetchMock = vi.fn(async () => geminiAudio(pcm.toString("base64")));
    vi.stubGlobal("fetch", fetchMock);

    const r = await geminiTts("k", "Olá, PHC!");
    expect(r.provider).toBe("gemini");
    expect(r.mimeType).toBe("audio/wav");
    const wav = Buffer.from(r.audio, "base64");
    expect(wav.subarray(0, 4).toString()).toBe("RIFF");
    expect(wav.subarray(44)).toEqual(pcm);
  });

  it("usa a voz Charon por omissão e o modelo 3.1-flash-tts", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        generationConfig: {
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } };
        };
      };
      expect(String(url)).toContain("gemini-3.1-flash-tts-preview:generateContent");
      expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
        GEMINI_DEFAULT_VOICE,
      );
      return geminiAudio(Buffer.from([0]).toString("base64"));
    });
    vi.stubGlobal("fetch", fetchMock);
    await geminiTts("k", "teste");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("repete automaticamente após 500 (comportamento documentado do 3.1-flash-tts)", async () => {
    const fetchMock = vi
      .fn<() => Promise<globalThis.Response>>()
      .mockResolvedValueOnce(jsonResponse({ error: { message: "tokens de texto" } }, 500))
      .mockResolvedValueOnce(geminiAudio(Buffer.from([1]).toString("base64")));
    vi.stubGlobal("fetch", fetchMock);

    const r = await geminiTts("k", "teste");
    expect(r.mimeType).toBe("audio/wav");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("recua para gemini-2.5-flash-preview-tts se o modelo não existir (404)", async () => {
    const urls: string[] = [];
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      urls.push(String(url));
      if (urls.length === 1) return jsonResponse({ error: { message: "not found" } }, 404);
      return geminiAudio(Buffer.from([2]).toString("base64"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const r = await geminiTts("k", "teste", "Charon", "modelo-inexistente");
    expect(r.provider).toBe("gemini");
    expect(urls[1]).toContain("gemini-2.5-flash-preview-tts");
  });

  it("não insiste com chave inválida (401 → erro imediato)", async () => {
    const fetchMock = vi
      .fn<() => Promise<globalThis.Response>>()
      .mockResolvedValue(jsonResponse({ error: { message: "API key not valid" } }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(geminiTts("chave-má", "teste")).rejects.toThrow(/401/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
