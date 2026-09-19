import { create } from "zustand";

interface UiState {
  chatOpen: boolean;
  paletteOpen: boolean;
  /** última missão visitada — contexto do chat do Professor */
  lastLab: string | null;
  openChat: () => void;
  closeChat: () => void;
  setPalette: (v: boolean) => void;
  setLastLab: (id: string | null) => void;
}

export const useUi = create<UiState>()((set) => ({
  chatOpen: false,
  paletteOpen: false,
  lastLab: null,
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  setPalette: (v) => set({ paletteOpen: v }),
  setLastLab: (id) => set({ lastLab: id }),
}));

/** dicas do Professor por rota (equivalente aos TAB_HINTS do legado) */
export const ROUTE_HINTS: Record<string, string> = {
  "/": "Uma coisa de cada vez: a sua missão atual está aqui. 🎯",
  "/missoes": "Trilha guiada — cada missão libera a seguinte. 🔒",
  "/aprender": "Circuitos, dicionário, enciclopédia, guia e gerador de código.",
  "/praticar": "Cartas e testes: a memória de longo prazo agradece.",
  "/equipa": "O formador acompanha todos aqui — e as chaves de IA ficam cifradas no servidor.",
  "/definicoes": "Empresa, voz, contexto e dados — tudo da sua conta.",
};

export function hintForPath(pathname: string): string {
  if (pathname.startsWith("/missoes/"))
    return "Modo Foco ▶: um passo de cada vez, com voz e IA. Sem evidência, não aconteceu.";
  return ROUTE_HINTS[pathname] ?? ROUTE_HINTS["/"];
}
