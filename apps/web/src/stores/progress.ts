import { create } from "zustand";
import {
  applyAchievements,
  bumpDaily,
  companyFromSegment,
  labSt,
  migrateState,
  rateCard,
  registerLabRep,
  submitQuiz,
  todayISO,
  toggleProof,
  toggleStep,
  type ProgressState,
} from "@phc/shared";
import { apiFetch } from "../lib/api.ts";
import { enqueue, isNetworkError } from "../lib/offlineQueue.ts";
import { toast } from "../components/ui/toast.tsx";

interface StateResponse {
  state: ProgressState;
  unlocked?: string[];
}

const SNAPSHOT_KEY = "phc.progressSnapshot.v1";

function saveSnapshot(s: ProgressState): void {
  try {
    const json = JSON.stringify(s);
    if (json.length < 2_500_000) localStorage.setItem(SNAPSHOT_KEY, json);
  } catch {
    /* quota — ignora */
  }
}

function loadSnapshot(): ProgressState | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    // snapshot pode ser de uma versão antiga (v3: voz do navegador) → migrar
    return raw ? migrateState(JSON.parse(raw) as ProgressState) : null;
  } catch {
    return null;
  }
}

interface ProgressStore {
  state: ProgressState | null;
  status: "idle" | "loading" | "ready" | "error";
  /** true quando o estado vem do snapshot local (sem rede) */
  offline: boolean;
  error: string | null;
  loadedFor: string | null;

  load: (userId: string, force?: boolean) => Promise<void>;
  reset: () => void;

  registerRep: (labId: string, timedSec?: number) => Promise<string[]>;
  toggleStep: (labId: string, index: number) => Promise<void>;
  toggleProof: (labId: string, index: number) => Promise<void>;
  markMastered: (labId: string) => Promise<string[]>;
  addEvidence: (lab: string, kind: string, txt: string) => Promise<string[]>;
  removeEvidence: (index: number) => Promise<void>;
  rateCard: (idx: number, q: 0 | 1 | 2) => Promise<void>;
  submitQuiz: (lv: number, pct: number) => Promise<string[]>;
  bumpStat: (kind: "lesson" | "chat" | "dict" | "circ" | "explic") => Promise<void>;
  setCompany: (segId: string, nome?: string, cidade?: string) => Promise<void>;
  setContexto: (pais: string, gama: string) => Promise<void>;
  updateSettings: (patch: Partial<ProgressState["settings"]>) => Promise<void>;
  syncFull: (patch: Partial<ProgressState>) => Promise<void>;
  importLegacy: (
    raw: string,
  ) => Promise<{ labs: number; cards: number; evidences: number; achievements: number }>;
  resetProgress: () => Promise<void>;
}

export const useProgress = create<ProgressStore>()((set, get) => {
  const apply = (r: StateResponse): string[] => {
    set({ state: r.state, status: "ready", error: null, offline: false });
    saveSnapshot(r.state);
    return r.unlocked ?? [];
  };

  /** muta localmente (offline) + anuncia à fila */
  const applyLocal = (fn: (s: ProgressState) => void): ProgressState | null => {
    const cur = get().state;
    if (!cur) return null;
    const next = structuredClone(cur);
    fn(next);
    applyAchievements(next, todayISO());
    set({ state: next });
    saveSnapshot(next);
    return next;
  };

  const queueIt = (method: string, path: string, body?: unknown) => {
    enqueue(method, path, body);
    window.dispatchEvent(new Event("phc:queue"));
    toast.info("📴 Sem ligação — guardado no dispositivo; sincroniza quando voltar a rede.");
  };

  /** POST/PUT com fallback offline: mutação local + fila de replay */
  const synced = async (
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body: unknown,
    local?: (s: ProgressState) => void,
  ): Promise<StateResponse> => {
    try {
      return await apiFetch<StateResponse>(path, { method, body });
    } catch (e) {
      if (isNetworkError(e) && local) {
        queueIt(method, path, body);
        applyLocal(local);
        return { state: get().state!, unlocked: [] };
      }
      throw e;
    }
  };

  return {
    state: null,
    status: "idle",
    offline: false,
    error: null,
    loadedFor: null,

    async load(userId, force = false) {
      const cur = get();
      if (!force && cur.loadedFor === userId && cur.state) return;
      if (cur.status === "loading") return;
      set({ status: "loading", error: null });
      try {
        const r = await apiFetch<{ state: ProgressState }>("/api/progress");
        set({ state: r.state, status: "ready", loadedFor: userId, offline: false });
        saveSnapshot(r.state);
      } catch (e) {
        if (isNetworkError(e)) {
          // offline: usa o snapshot local (leitura + ações enfileiradas)
          const snap = loadSnapshot();
          if (snap) {
            set({ state: snap, status: "ready", loadedFor: userId, offline: true });
            return;
          }
          set({
            status: "error",
            offline: true,
            error: "Sem ligação e sem dados locais — reconecte para carregar o seu progresso.",
          });
          return;
        }
        set({ status: "error", error: (e as Error).message });
      }
    },

    reset() {
      set({ state: null, status: "idle", error: null, loadedFor: null, offline: false });
    },

    async registerRep(labId, timedSec) {
      const r = await synced("POST", "/api/progress/reps", { labId, timedSec }, (s) => {
        const st = registerLabRep(s, labId);
        if (typeof timedSec === "number") (st.timed ||= []).push(timedSec);
      });
      return apply(r);
    },
    async toggleStep(labId, index) {
      apply(
        await synced("POST", "/api/progress/steps", { labId, index }, (s) =>
          toggleStep(s, labId, index),
        ),
      );
    },
    async toggleProof(labId, index) {
      apply(
        await synced("POST", "/api/progress/proofs", { labId, index }, (s) =>
          toggleProof(s, labId, index),
        ),
      );
    },
    async markMastered(labId) {
      const r = await synced("POST", "/api/progress/mastered", { labId }, (s) => {
        labSt(s, labId).mem = true;
      });
      return apply(r);
    },
    async addEvidence(lab, kind, txt) {
      const r = await synced("POST", "/api/progress/evid", { lab, kind, txt }, (s) => {
        s.evid.unshift({ d: todayISO(), lab, kind, txt });
        bumpDaily(s, "proofs");
      });
      return apply(r);
    },
    async removeEvidence(index) {
      apply(
        await synced("DELETE", `/api/progress/evid/${index}`, undefined, (s) => {
          s.evid.splice(index, 1);
        }),
      );
    },
    async rateCard(idx, q) {
      apply(
        await synced("POST", "/api/progress/cards/rate", { idx, q }, (s) => rateCard(s, idx, q)),
      );
    },
    async submitQuiz(lv, pct) {
      const r = await synced("POST", "/api/progress/quiz", { lv, pct }, (s) =>
        submitQuiz(s, lv, pct),
      );
      return apply(r);
    },
    async bumpStat(kind) {
      apply(
        await synced("POST", "/api/progress/stats", { kind }, (s) => {
          const map = {
            lesson: "lessons",
            chat: "chats",
            dict: "circ",
            circ: "circ",
            explic: "explics",
          } as const;
          const f = map[kind];
          s.stats[f] = (s.stats[f] || 0) + 1;
          if (kind === "lesson") bumpDaily(s, "lessons");
        }),
      );
    },
    async setCompany(segId, nome, cidade) {
      apply(
        await synced("PUT", "/api/progress/company", { segId, nome, cidade }, (s) => {
          s.company = companyFromSegment(segId, nome, cidade);
        }),
      );
    },
    async setContexto(pais, gama) {
      apply(
        await synced("PUT", "/api/progress/contexto", { pais, gama }, (s) => {
          s.contexto = { pais, gama };
        }),
      );
    },
    async updateSettings(patch) {
      apply(
        await synced(
          "PUT",
          "/api/progress/settings",
          { ...(get().state?.settings ?? {}), ...patch },
          (s) => {
            s.settings = { ...s.settings, ...patch };
          },
        ),
      );
    },
    async syncFull(patch) {
      apply(
        await synced("PUT", "/api/progress", patch, (s) => {
          Object.assign(s, patch);
        }),
      );
    },
    async importLegacy(raw) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("JSON inválido — cole o ficheiro exportado pelo app legado.");
      }
      const r = await apiFetch<{
        imported: { labs: number; cards: number; evidences: number; achievements: number };
        state: ProgressState;
      }>("/api/meta/import-legacy", { method: "POST", body: parsed });
      set({ state: r.state, status: "ready", offline: false });
      saveSnapshot(r.state);
      return r.imported;
    },
    async resetProgress() {
      apply(await apiFetch<StateResponse>("/api/meta/reset", { method: "POST" }));
    },
  };
});
