import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { X } from "lucide-react";
import { labById, theoryFor } from "@phc/content";
import { applyCompanyText, hashStr, type ProgressState } from "@phc/shared";
import { aiCacheGet, aiCacheSet } from "../../lib/aiCache.ts";
import { useProgress } from "../../stores/progress.ts";
import { useAi } from "../../hooks/useAi.ts";
import { useTts } from "../../hooks/useTts.ts";
import { useMascot } from "../../stores/mascot.ts";
import { Markdown } from "../../components/ui/Markdown.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { ProgressBar } from "../../components/ui/progress.tsx";
import { toast } from "../../components/ui/toast.tsx";

/* ---------- store da Aula Guiada (equivalente ao Lesson do legado) ---------- */
interface LessonState {
  open: boolean;
  items: string[];
  title: string;
  i: number;
  autoNext: boolean;
  start: (title: string, items: string[]) => void;
  close: () => void;
  set: (patch: Partial<Pick<LessonState, "i" | "autoNext">>) => void;
}

export const useLesson = create<LessonState>()((set) => ({
  open: false,
  items: [],
  title: "",
  i: 0,
  autoNext: false,
  start: (title, items) => set({ open: true, title, items, i: 0 }),
  close: () => set({ open: false }),
  set: (patch) => set(patch),
}));

/** constrói a aula de uma missão (porta do labLesson legado) */
export function startLabLesson(labId: string, state: ProgressState): void {
  const lab = labById(labId);
  if (!lab) return;
  const emp = (t: string) => applyCompanyText(t, state.company);
  const th = theoryFor(labId);
  const items: string[] = [];
  if (th) {
    items.push(emp(th.c));
    for (const p of th.s ?? []) items.push(`CONCEITO — ${emp(p[0])}: ${emp(p[1])}`);
    for (const e of th.e ?? []) items.push(`ERRO COMUM a evitar: ${emp(e)}`);
  }
  items.push(`OBJETIVO DA MISSÃO: ${emp(lab.goal)}`);
  lab.steps.forEach((s, i) => items.push(`PASSO ${i + 1}: ${emp(s)}`));
  if (!items.length) {
    toast.info("Nada para explicar aqui.");
    return;
  }
  useLesson.getState().start(`${lab.id} · ${emp(lab.t)}`, items);
  useMascot
    .getState()
    .say(
      "🎓 Aula guiada: vou explicar parágrafo a parágrafo, aplicado à sua empresa.",
      "talk",
      6000,
    );
}

/* ---------- componente ---------- */
export function LessonDrawer() {
  const lesson = useLesson();
  const state = useProgress((s) => s.state);
  const store = useProgress.getState;
  const ai = useAi();
  const tts = useTts();
  const [exp, setExp] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const loadingRef = useRef(false);

  const text = lesson.items[lesson.i] ?? "";

  // carrega a explicação do item atual (com cache local; modo económico = sem IA)
  useEffect(() => {
    if (!lesson.open || !text || !state) return;
    let cancelled = false;
    (async () => {
      setExp(null);
      setErr(null);
      if (state.settings.economy) return;
      const key = hashStr("LESSON" + text);
      const cached = aiCacheGet(key);
      if (cached) {
        if (cancelled) return;
        setExp(cached);
        if (state.settings.tts) {
          useMascot.getState().setMood("talk");
          await tts.speak(cached);
          useMascot.getState().setMood("idle");
          if (!cancelled && useLesson.getState().autoNext && useLesson.getState().open)
            setTimeout(() => next(), 900);
        }
        return;
      }
      if (loadingRef.current) return;
      loadingRef.current = true;
      useMascot.getState().setMood("think");
      try {
        const labIdMatch = lesson.title.match(/^(L\d{2})/);
        const out = await ai.chat({
          kind: "lesson",
          labId: labIdMatch?.[1],
          maxTokens: 380,
          messages: [
            {
              role: "user",
              content:
                `AULA PASSO A PASSO — item ${lesson.i + 1} de ${lesson.items.length} da missão '${lesson.title}'.\n\nCONTEÚDO:\n` +
                String(text).slice(0, 2400) +
                "\n\nExplique em linguagem muito simples (máx. 90 palavras), aplicando à EMPRESA EM FOCO (dada no contexto), com exemplos simples. " +
                "Se for um PASSO prático, diga exatamente o que o aluno vai ver/fazer no PHC e por quê.",
            },
          ],
        });
        aiCacheSet(key, out.text);
        await store()
          .bumpStat("lesson")
          .catch(() => undefined);
        if (cancelled) return;
        setExp(out.text);
        useMascot.getState().setMood("idle");
        if (state.settings.tts) {
          useMascot.getState().setMood("talk");
          await tts.speak(out.text);
          useMascot.getState().setMood("idle");
          if (!cancelled && useLesson.getState().autoNext && useLesson.getState().open)
            setTimeout(() => next(), 900);
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
        useMascot.getState().setMood("idle");
      } finally {
        loadingRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.open, lesson.i, state?.settings.economy, retry]);

  useEffect(() => {
    if (!lesson.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.open]);

  if (!lesson.open || !state) return null;
  const total = lesson.items.length;

  function next() {
    const l = useLesson.getState();
    if (l.i < l.items.length - 1) l.set({ i: l.i + 1 });
    else {
      l.close();
      tts.stop();
      toast.success("🎓 Aula concluída. Agora execute os passos no PHC e guarde as evidências.");
      useMascot
        .getState()
        .say("Aula concluída! Agora é consigo — pratique e guarde as provas. 🎓", "cheer", 7000);
    }
  }

  function prev() {
    const l = useLesson.getState();
    if (l.i > 0) l.set({ i: l.i - 1 });
  }

  function closeAll() {
    tts.stop();
    useLesson.getState().close();
  }

  return (
    <>
      <div className="drawerOverlay" onClick={closeAll} />
      <div className="drawerPanel" role="dialog" aria-label="Aula guiada">
        <div className="drawerHead">
          <div>
            <b className="text-sm text-primary">🎓 Aula Guiada</b>
            <div className="text-xs text-muted-foreground">{lesson.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {lesson.i + 1}/{total}
            </span>
            <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="accent-[#f5a623]"
                checked={lesson.autoNext}
                onChange={(e) => lesson.set({ autoNext: e.target.checked })}
              />
              auto
            </label>
            <Button variant="ghost" size="icon" onClick={closeAll} aria-label="Fechar aula">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="drawerBody space-y-3">
          <ProgressBar value={((lesson.i + 1) / total) * 100} />
          <div className="origCard">
            <b className="text-xs text-muted-foreground">📄 CONTEÚDO ORIGINAL</b>
            <div className="origText mt-1">{text}</div>
          </div>
          <div className="rounded-md border border-info/40 bg-[#0f1d33] p-3">
            <b className="text-sm text-info">
              🧠 Professor Einstein — explicação aplicada à sua empresa
            </b>
            {ai.loading && !exp && (
              <p className="mt-2 text-sm text-muted-foreground">
                O professor está a pensar <span className="inline-block animate-spin">⚛️</span>
              </p>
            )}
            {err && (
              <Alert variant="warning" className="mt-2">
                IA indisponível: {err}
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setErr(null);
                      setRetry((r) => r + 1);
                    }}
                  >
                    Tentar de novo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void store().updateSettings({ economy: true })}
                  >
                    Modo económico (só leitura em voz alta)
                  </Button>
                </div>
              </Alert>
            )}
            {exp && !err && <Markdown className="mt-2">{exp}</Markdown>}
            {!exp && !err && !ai.loading && state.settings.economy && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Modo económico: sem IA. Use 🔊 para ouvir o texto original.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => void tts.speak(text)}
                >
                  🔊 Ouvir original
                </Button>
              </div>
            )}
          </div>
          {state.plan?.nota && (
            <p className="text-xs text-muted-foreground">
              <Badge variant="muted">curso</Badge> {state.plan.nota}
            </p>
          )}
        </div>

        <div className="drawerFoot flex flex-wrap gap-2">
          <Button variant="outline" disabled={lesson.i === 0} onClick={prev}>
            ⬅ Anterior
          </Button>
          {exp && (
            <Button variant="outline" onClick={() => void tts.speak(exp)}>
              🔊 Ouvir
            </Button>
          )}
          {(exp || state.settings.economy) && (
            <Button variant="ghost" onClick={() => tts.stop()}>
              ⏹ Parar voz
            </Button>
          )}
          {(state.settings.economy || err) && (
            <Button variant="ghost" onClick={() => void store().updateSettings({ economy: false })}>
              🧠 Ligar a IA
            </Button>
          )}
          <Button className="ml-auto" onClick={next}>
            {lesson.i === total - 1 ? "✅ Concluir aula" : "Próximo ➡"}
          </Button>
        </div>
      </div>
    </>
  );
}
