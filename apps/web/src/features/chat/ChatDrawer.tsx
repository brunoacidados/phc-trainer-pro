import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Square, Trash2, Volume2, X } from "lucide-react";
import { useUi } from "../../stores/ui.ts";
import { useAi } from "../../hooks/useAi.ts";
import { useTts } from "../../hooks/useTts.ts";
import { useMascot } from "../../stores/mascot.ts";
import { EinsteinSVG } from "../../components/mascot/Mascot.tsx";
import { Markdown } from "../../components/ui/Markdown.tsx";
import { Copy, Check } from "lucide-react";
import { Button } from "../../components/ui/button.tsx";
import { Textarea } from "../../components/ui/input.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { toast } from "../../components/ui/toast.tsx";
import { apiFetch } from "../../lib/api.ts";

interface Msg {
  role: "user" | "assistant";
  txt: string;
}

const GREETING: Msg = {
  role: "assistant",
  txt: "Olá! 🎓 Sou o Professor Einstein, o seu tutor de IA. Pergunte o que quiser sobre o PHC Gestão — explico de forma simples, sempre aplicado à sua empresa de treino. E lembre: sem evidência, não há aprendizado.",
};

const QUICK = [
  "Explica-me o que é o stamp",
  "Como funciona uma série de documentos?",
  "O que é o SAF-T (PT)?",
  "Diferença entre grupos e perfis de acesso?",
];

/** Chat global com o Professor — histórico persistente + streaming token-a-token */
export function ChatDrawer() {
  const { chatOpen, closeChat, lastLab } = useUi();
  const ai = useAi();
  const tts = useTts();
  const setMood = useMascot((s) => s.setMood);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);

  // carrega o histórico persistido ao abrir (1ª vez por sessão)
  useEffect(() => {
    if (!chatOpen || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetch<{ messages: { role: "user" | "assistant"; content: string }[] }>(
          "/api/chat",
        );
        if (cancelled) return;
        if (r.messages?.length)
          setMsgs([GREETING, ...r.messages.map((m) => ({ role: m.role, txt: m.content }))]);
      } catch {
        /* sem histórico ainda */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatOpen, loaded]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, chatOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen, closeChat]);

  const send = useCallback(
    async (text?: string) => {
      const q = (text ?? input).trim();
      if (!q || streamingRef.current) return;
      setInput("");
      setMsgs((m) => [...m, { role: "user", txt: q }, { role: "assistant", txt: "" }]);
      streamingRef.current = true;
      setMood("think");
      try {
        await ai.chatStream(
          {
            kind: "chat",
            labId: lastLab ?? undefined,
            maxTokens: 600,
            messages: [{ role: "user", content: q }],
          },
          (tok) => {
            // acrescenta o token à última mensagem (assistant, em streaming)
            setMsgs((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last && last.role === "assistant")
                copy[copy.length - 1] = { ...last, txt: last.txt + tok };
              return copy;
            });
          },
        );
        setMood("idle");
      } catch (e) {
        setMood("idle");
        const msg = (e as Error).message;
        setMsgs((m) => {
          const copy = [...m];
          if (copy[copy.length - 1]?.role === "assistant" && !copy[copy.length - 1].txt) copy.pop();
          return [...copy, { role: "assistant", txt: `⚠ ${msg}` }];
        });
        toast.error(msg);
      } finally {
        streamingRef.current = false;
      }
    },
    [ai, input, lastLab, setMood],
  );

  const lastText = msgs[msgs.length - 1]?.txt || "";

  if (!chatOpen) return null;

  return (
    <>
      <div className="drawerOverlay" onClick={closeChat} />
      <div className="drawerPanel" role="dialog" aria-label="Chat com o Professor Einstein">
        <div className="drawerHead">
          <div className="flex items-center gap-2">
            <div className="chatAv">
              <EinsteinSVG mood="idle" />
            </div>
            <div>
              <b className="text-sm text-primary">Professor Einstein</b>
              <div className="text-xs text-muted-foreground">
                Tutor IA{" "}
                {lastLab ? (
                  <Badge variant="info" className="ml-1">
                    missão {lastLab}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Limpar histórico"
              onClick={async () => {
                await apiFetch("/api/chat", { method: "DELETE" }).catch(() => undefined);
                setMsgs([GREETING]);
                toast.info("Histórico limpo.");
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={closeChat} aria-label="Fechar chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="drawerBody" ref={listRef}>
          <div className="chatList">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="chatTxt max-w-[85%] whitespace-pre-wrap">{m.txt}</div>
                </div>
              ) : (
                <AssistantBubble
                  key={i}
                  text={m.txt}
                  streaming={i === msgs.length - 1 && streamingRef.current}
                />
              ),
            )}
          </div>
          {msgs.length <= 1 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  className="cursor-pointer rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                  onClick={() => void send(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="drawerFoot">
          <div className="flex items-end gap-2">
            <Textarea
              rows={2}
              value={input}
              placeholder="Pergunte sobre o PHC Gestão… (Enter envia, Shift+Enter nova linha)"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <div className="flex flex-col gap-1">
              <Button
                size="icon"
                onClick={() => void send()}
                disabled={streamingRef.current || !input.trim()}
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </Button>
              {speaking ? (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    tts.stop();
                    setSpeaking(false);
                  }}
                  aria-label="Parar voz"
                >
                  <Square className="h-3 w-3" />
                </Button>
              ) : lastText ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    setSpeaking(true);
                    await tts.speak(lastText);
                    setSpeaking(false);
                  }}
                  aria-label="Ouvir última"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AssistantBubble({ text, streaming }: { text: string; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2.5">
      <div className="chatAv mt-0.5 shrink-0">
        <EinsteinSVG mood={streaming ? "talk" : "idle"} />
      </div>
      <div className="group min-w-0 flex-1">
        {text ? (
          <Markdown className="rounded-lg border border-border/60 bg-card/60 px-3.5 py-2.5">
            {text}
          </Markdown>
        ) : streaming ? (
          <div className="flex items-center gap-1.5 py-2 text-muted-foreground">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
          </div>
        ) : null}
        {text && !streaming && (
          <button
            className="mt-1 flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            onClick={() => {
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            {copied ? "copiado" : "copiar resposta"}
          </button>
        )}
      </div>
    </div>
  );
}
