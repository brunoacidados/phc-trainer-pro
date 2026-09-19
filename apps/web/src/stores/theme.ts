import { create } from "zustand";

type Theme = "dark" | "light";
const KEY = "phc.theme";

function initial(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch { /* ignore */ }
  return "dark";
}

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
}

interface ThemeState { theme: Theme; toggle: () => void }
export const useTheme = create<ThemeState>()((set, get) => ({
  theme: initial(),
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    apply(next);
    set({ theme: next });
  },
}));
apply(initial());
