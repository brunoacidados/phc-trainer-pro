import { describe, expect, it } from "vitest";
import {
  DEFAULT_GM_VOICE,
  STATE_VERSION,
  defaultProgress,
  defaultSettings,
  migrateState,
} from "../index.ts";
import type { ProgressState } from "../types.ts";

function v3State(patch: Partial<ProgressState["settings"]> = {}): ProgressState {
  const s = defaultProgress();
  s.v = 3;
  s.settings = {
    ttsProvider: "browser",
    gmVoice: "Sulafat",
    gmModel: "gemini-3.1-flash-tts-preview",
    ...patch,
  } as ProgressState["settings"];
  return s;
}

describe("migrateState v3 → v4 (voz Gemini por omissão)", () => {
  it("default novo já nasce em v4 com Gemini + Charon", () => {
    const s = defaultProgress();
    expect(s.v).toBe(STATE_VERSION);
    expect(defaultSettings().ttsProvider).toBe("gemini");
    expect(defaultSettings().gmVoice).toBe(DEFAULT_GM_VOICE);
  });

  it("estado v3 com provider 'browser' (default antigo) passa para gemini + Charon", () => {
    const s = migrateState(v3State());
    expect(s.v).toBe(4);
    expect(s.settings.ttsProvider).toBe("gemini");
    expect(s.settings.gmVoice).toBe("Charon");
  });

  it("respeita escolha explícita (ttsTouched) — browser fica", () => {
    const s = migrateState(v3State({ ttsProvider: "browser", ttsTouched: true }));
    expect(s.settings.ttsProvider).toBe("browser");
    expect(s.settings.gmVoice).toBe("Sulafat");
    expect(s.v).toBe(4);
  });

  it("respeita fornecedores que nunca foram default (elevenlabs/groq)", () => {
    expect(migrateState(v3State({ ttsProvider: "elevenlabs" })).settings.ttsProvider).toBe(
      "elevenlabs",
    );
    expect(migrateState(v3State({ ttsProvider: "groq" })).settings.ttsProvider).toBe("groq");
  });

  it("voz Gemini escolhida (diferente do default antigo) não é pisada", () => {
    const s = migrateState(v3State({ gmVoice: "Kore" }));
    expect(s.settings.gmVoice).toBe("Kore");
  });

  it("é idempotente — migrar duas vezes não altera nada", () => {
    const once = migrateState(v3State());
    const twice = migrateState(JSON.parse(JSON.stringify(once)) as ProgressState);
    expect(twice).toEqual(once);
    expect(twice.v).toBe(STATE_VERSION);
  });

  it("estado sem settings não rebenta e recebe defaults", () => {
    const broken = { v: 3 } as unknown as ProgressState;
    const s = migrateState(broken);
    expect(s.v).toBe(4);
    expect(s.settings.ttsProvider).toBe("gemini");
  });
});
