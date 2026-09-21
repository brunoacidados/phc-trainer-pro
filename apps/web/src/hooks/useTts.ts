import { useCallback, useRef } from "react";
import { speakBrowser, speakCloud, stopAudio } from "../lib/audio.ts";
import { useProgress } from "../stores/progress.ts";
import { useMascot } from "../stores/mascot.ts";

/** voz do Professor: cloud (servidor) com fallback automático no navegador */
export function useTts() {
  const gen = useRef(0);
  const state = useProgress((s) => s.state);

  const speak = useCallback(
    async (text: string) => {
      const settings = state?.settings;
      if (!settings?.tts || !text) return;
      stopAudio();
      const my = ++gen.current;
      useMascot.getState().setMood("talk");
      const provider = settings.ttsProvider;
      const chunks = chunkText(text, 420);
      for (const c of chunks) {
        if (my !== gen.current) return;
        try {
          if (provider === "browser") await speakBrowser(c, settings.rate);
          else {
            const voice =
              provider === "gemini"
                ? settings.gmVoice
                : provider === "elevenlabs"
                  ? settings.elVoice
                  : settings.grVoice;
            await speakCloud(
              c,
              provider,
              voice,
              provider === "gemini" ? settings.gmModel : undefined,
            );
          }
        } catch {
          if (my !== gen.current) return;
          if (settings.ttsFallback !== false) await speakBrowser(c, settings.rate);
        }
      }
      if (my === gen.current) useMascot.getState().setMood("idle");
    },
    [state],
  );

  const stop = useCallback(() => {
    gen.current++;
    stopAudio();
    try {
      speechSynthesis.cancel();
    } catch {
      /* noop */
    }
  }, []);

  return { speak, stop };
}

function chunkText(text: string, size: number): string[] {
  const out: string[] = [];
  const parts = String(text).split(/(?<=[.!?…])\s+/);
  let cur = "";
  for (const p of parts) {
    if ((cur + p).length > size && cur) {
      out.push(cur.trim());
      cur = p;
    } else cur += " " + p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.length ? out : [String(text).slice(0, size)];
}
