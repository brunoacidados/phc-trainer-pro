import { useCallback, useState } from "react";
import { type AiChatInput } from "@phc/shared";
import { ACHIEVEMENTS } from "@phc/content";
import { aiCacheGet, aiCacheKeyFor, aiCacheSet } from "../lib/aiCache.ts";
import { apiFetch, apiStream } from "../lib/api.ts";
import { toast } from "../components/ui/toast.tsx";
import { useMascot } from "../stores/mascot.ts";

interface ChatResponse {
  text: string;
  provider: string;
  cached: boolean;
}

/** notifica conquistas desbloqueadas (ids devolvidos pelo servidor) */
export function announceAchievements(unlocked: string[]): void {
  for (const id of unlocked) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) toast.success(`🏅 Conquista desbloqueada: ${a.ico} ${a.t}`);
  }
}

/**
 * Hook do tutor de IA (servidor faz o routing multi-fornecedor).
 * `explain` usa cache local: o mesmo texto nunca consome créditos 2×.
 */
export function useAi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = useCallback(async (req: AiChatInput): Promise<ChatResponse> => {
    setLoading(true);
    setError(null);
    useMascot.getState().setMood("think");
    try {
      const r = await apiFetch<ChatResponse>("/api/ai/chat", { method: "POST", body: req });
      return r;
    } catch (e) {
      const msg = (e as Error).message || "Falha na chamada de IA";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
      useMascot.getState().setMood("idle");
    }
  }, []);

  /**
   * Chat com streaming (SSE): chama onToken por pedaço de texto.
   * Devolve o texto completo + fornecedor. Usa o mesmo routing do servidor.
   */
  const chatStream = useCallback(
    async (req: AiChatInput, onToken: (t: string) => void): Promise<ChatResponse> => {
      setLoading(true);
      setError(null);
      useMascot.getState().setMood("think");
      let full = "";
      let provider = "";
      try {
        await apiStream("/api/ai/chat-stream", req, (event, data) => {
          const d = data as { t?: string; provider?: string; message?: string };
          if (event === "token" && d.t) {
            if (!full) useMascot.getState().setMood("talk");
            full += d.t;
            onToken(d.t);
          } else if (event === "done") {
            provider = d.provider || "";
          } else if (event === "error") {
            throw new Error(d.message || "erro no stream");
          }
        });
        return { text: full, provider, cached: false };
      } catch (e) {
        const msg = (e as Error).message || "Falha na chamada de IA";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
        useMascot.getState().setMood("idle");
      }
    },
    [],
  );

  /** explicação simples de um texto (botão 🧠), com cache local */
  const explain = useCallback(
    async (text: string, ctxTitle: string, labId?: string): Promise<string> => {
      const key = aiCacheKeyFor(["explain", labId ?? "", text.slice(0, 400)]);
      const hit = aiCacheGet(key);
      if (hit) return hit;
      const r = await chat({
        kind: "explain",
        labId,
        maxTokens: 420,
        messages: [
          {
            role: "user",
            content:
              `CONTEÚDO ORIGINAL (${ctxTitle}):\n${text.slice(0, 2600)}\n\n` +
              "Explique em linguagem muito simples (para um leigo), em no máximo 110 palavras, " +
              "aplicando à EMPRESA EM FOCO (dada no contexto), com exemplos simples.",
          },
        ],
      });
      aiCacheSet(key, r.text);
      return r.text;
    },
    [chat],
  );

  return { chat, chatStream, explain, loading, error };
}
