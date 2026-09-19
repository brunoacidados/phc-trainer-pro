import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { labById } from "@phc/content";
import { applyCompanyText, LADDER } from "@phc/shared";
import { useProgress } from "../../stores/progress.ts";
import { useAi, announceAchievements } from "../../hooks/useAi.ts";
import { useTts } from "../../hooks/useTts.ts";
import { useMascot } from "../../stores/mascot.ts";
import { Dialog } from "../../components/ui/dialog.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { ProgressBar } from "../../components/ui/progress.tsx";
import { toast } from "../../components/ui/toast.tsx";
import { Markdown } from "../../components/ui/Markdown.tsx";

/* ---------- store do Modo Foco (equivalente ao FOC do legado) ---------- */
type Phase = "steps" | "proofs" | "asks" | "done";

interface FocusState {
  open: boolean;
  id: string | null;
  phase: Phase;
  i: number;
  askI: number;
  showAns: boolean;
  openFocus: (labId: string, firstUndone?: number) => void;
  close: () => void;
  set: (patch: Partial<Omit<FocusState, "openFocus" | "close" | "set">>) => void;
}

export const useFocus = create<FocusState>()((set) => ({
  open: false,
  id: null,
  phase: "steps",
  i: 0,
  askI: 0,
  showAns: false,
  openFocus: (labId, firstUndone = 0) =>
    set({ open: true, id: labId, phase: "steps", i: firstUndone, askI: 0, showAns: false }),
  close: () => set({ open: false, id: null }),
  set: (patch) => set(patch),
}));

/** abre o Modo Foco na primeira passagem por fazer */
export function openFocusFor(labId: string): void {
  const state = useProgress.getState().state;
  const lab = labById(labId);
  if (!lab) return;
  const steps = state?.labs[labId]?.steps ?? {};
  let k = 0;
  while (k < lab.steps.length && steps[String(k)]) k++;
  useFocus.getState().openFocus(labId, Math.min(k, lab.steps.length - 1));
  useMascot
    .getState()
    .say(`Modo Foco: ${labId}. Um passo de cada vez — sem pressa, com prova. 🎯`, "idle", 7000);
}

/* ---------- componente ---------- */
export function FocusModal() {
  const foc = useFocus();
  const state = useProgress((s) => s.state);
  const store = useProgress.getState;
  const ai = useAi();
  const tts = useTts();
  const navigate = useNavigate();
  const [exp, setExp] = useState<Record<number, string>>({});

  if (!foc.open || !foc.id || !state) return null;
  const lab = labById(foc.id);
  if (!lab) return null;
  const st = state.labs[foc.id];
  const emp = (t: string) => applyCompanyText(t, state.company);

  const explainStep = async () => {
    if (!lab) return;
    const txt = `PASSO ${foc.i + 1} da missão ${lab.id} (${emp(lab.t)}): ${emp(lab.steps[foc.i])}`;
    try {
      const out = await ai.explain(txt, `missão ${lab.id} — passo ${foc.i + 1}`, lab.id);
      setExp((m) => ({ ...m, [foc.i]: out }));
      await store().bumpStat("lesson");
      if (state.settings.tts) {
        useMascot.getState().setMood("talk");
        await tts.speak(out);
        useMascot.getState().setMood("idle");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const stepDone = async () => {
    await store().toggleStep(foc.id!, foc.i);
    tts.stop();
    if (foc.i < lab!.steps.length - 1) foc.set({ i: foc.i + 1 });
    else foc.set({ phase: "proofs" });
  };

  let body: React.ReactNode = null;

  if (foc.phase === "steps") {
    const total = lab.steps.length;
    body = (
      <div>
        <ProgressBar value={(foc.i / total) * 100} label={`Passo ${foc.i + 1} de ${total}`} />
        <div className="focusCard mt-3">
          <div className="text-xs text-muted-foreground">
            PASSO {foc.i + 1} DE {total} · execute no PHC agora
          </div>
          <div className="focusStep">{emp(lab.steps[foc.i])}</div>
        </div>
        {exp[foc.i] && (
          <div className="mt-2 rounded-md border border-info/40 bg-[#0f1d33] p-3">
            <b className="text-sm text-info">🧠 Professor Einstein</b>
            <Markdown className="mt-1">{exp[foc.i]}</Markdown>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="lg" variant="outline" onClick={() => void tts.speak(emp(lab.steps[foc.i]))}>
            🔊 Ouvir
          </Button>
          <Button
            size="lg"
            variant="secondary"
            loading={ai.loading}
            onClick={() => void explainStep()}
          >
            🧠 Explicar
          </Button>
          {foc.i > 0 && (
            <Button size="lg" variant="ghost" onClick={() => foc.set({ i: foc.i - 1 })}>
              ◀ Voltar
            </Button>
          )}
          <Button size="lg" onClick={() => void stepDone()}>
            {foc.i === total - 1 ? "✅ Concluir passos" : "✅ Feito, próximo ▶"}
          </Button>
        </div>
      </div>
    );
  } else if (foc.phase === "proofs") {
    body = (
      <div>
        <Alert variant="info">
          <b>📸 Evidências da missão</b> — sem evidência, não há aprendizado. Guarde em{" "}
          <code className="rounded bg-secondary px-1">C:\PHC-Treino\evidencias\{lab.id}\</code> e
          marque abaixo.
        </Alert>
        <div className="mt-3 space-y-2">
          {lab.proofs.map((p, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#3ddc84]"
                checked={!!st?.proofs?.[String(i)]}
                onChange={() => void store().toggleProof(foc.id!, i)}
              />
              <span>
                <Badge variant="info" className="mr-2">
                  {p.k}
                </Badge>
                {emp(p.d)}
              </span>
            </label>
          ))}
        </div>
        <Button
          className="mt-4"
          size="lg"
          onClick={() => foc.set({ phase: "asks", askI: 0, showAns: false })}
        >
          Ir para as perguntas ▶
        </Button>
      </div>
    );
  } else if (foc.phase === "asks") {
    const a = lab.ask[foc.askI];
    body = a ? (
      <div>
        <div className="text-xs text-muted-foreground">
          PERGUNTA {foc.askI + 1} DE {lab.ask.length} · responda EM VOZ ALTA antes de revelar
        </div>
        <div className="focusCard mt-2">
          <div className="focusStep">{emp(a.q)}</div>
        </div>
        {foc.showAns && (
          <div className="mt-2 rounded-md border border-info/40 bg-[#0f1d33] p-3">
            <p className="expText">{emp(a.a)}</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {!foc.showAns && (
            <Button size="lg" variant="outline" onClick={() => foc.set({ showAns: true })}>
              👁 Ver resposta
            </Button>
          )}
          {foc.showAns && (
            <Button size="lg" variant="outline" onClick={() => void tts.speak(emp(a.a))}>
              🔊 Ouvir
            </Button>
          )}
          <Button
            size="lg"
            onClick={() => {
              if (foc.askI < lab.ask.length - 1) foc.set({ askI: foc.askI + 1, showAns: false });
              else foc.set({ phase: "done" });
            }}
          >
            {foc.askI === lab.ask.length - 1 ? "✅ Finalizar" : "Próxima ▶"}
          </Button>
        </div>
      </div>
    ) : (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">Esta missão não tem perguntas — avance.</p>
        <Button className="mt-3" onClick={() => foc.set({ phase: "done" })}>
          ✅ Concluir
        </Button>
      </div>
    );
  } else {
    const stepsDone = Object.values(st?.steps ?? {}).filter(Boolean).length;
    const proofsDone = Object.values(st?.proofs ?? {}).filter(Boolean).length;
    body = (
      <div className="py-4 text-center">
        <div className="text-5xl">🎉</div>
        <h3 className="mt-2 text-lg font-bold">Missão {lab.id} executada!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Passos: {stepsDone}/{lab.steps.length} · Evidências: {proofsDone}/{lab.proofs.length}
        </p>
        <p className="mt-2 text-sm">
          Registe a repetição: a missão volta em{" "}
          <b>{LADDER[Math.min(st?.c ?? 0, LADDER.length - 1)]} dia(s)</b> para a refazer{" "}
          <b>sem ler os passos</b>.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            size="lg"
            onClick={async () => {
              const unlocked = await store().registerRep(foc.id!);
              announceAchievements(unlocked);
              useMascot
                .getState()
                .say("+1 repetição. Constância gera competência. 🔁", "cheer", 6000);
              foc.close();
            }}
          >
            ✅ Registar repetição
          </Button>
          {(st?.c ?? 0) >= 2 && !st?.mem && (
            <Button
              size="lg"
              variant="success"
              onClick={async () => {
                const unlocked = await store().markMastered(foc.id!);
                announceAchievements(unlocked);
                useMascot
                  .getState()
                  .say(
                    "🧠 DE COR E SALTEADO! O Professor está orgulhoso, meu jovem gênio!",
                    "cheer",
                    7000,
                  );
                foc.close();
              }}
            >
              🧠 Sei de cor
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              foc.close();
              navigate(`/missoes/${lab.id}`);
            }}
          >
            Ver ficha completa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={foc.open}
      onClose={() => {
        tts.stop();
        foc.close();
      }}
      wide
      title={
        <span className="flex items-center gap-2">
          <b className="text-primary">{lab.id}</b>
          <span className="font-normal">{emp(lab.t)}</span>
          <Badge variant="warning">Modo Foco</Badge>
        </span>
      }
    >
      {body}
    </Dialog>
  );
}
