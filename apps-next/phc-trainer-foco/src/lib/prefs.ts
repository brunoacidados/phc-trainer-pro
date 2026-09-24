/**
 * Preferências de leitura/estímulo. Guardadas em cookie para o servidor renderizar
 * logo com o tema certo (sem "flash" de tema errado — um micro-susto evitável).
 */
export type Theme = "claro" | "escuro" | "calmo";
export type TextSize = "normal" | "grande" | "enorme";

export interface Prefs {
  theme: Theme;
  size: TextSize;
  /** reduzir animações (além do prefers-reduced-motion do sistema) */
  calmMotion: boolean;
  /** esconder navegação e extras durante missões */
  focus: boolean;
}

export const PREFS_COOKIE = "phc_prefs";
export const DEFAULT_PREFS: Prefs = { theme: "claro", size: "normal", calmMotion: false, focus: false };

const THEMES: Theme[] = ["claro", "escuro", "calmo"];
const SIZES: TextSize[] = ["normal", "grande", "enorme"];

export function parsePrefs(raw: string | undefined): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: THEMES.includes(p.theme as Theme) ? (p.theme as Theme) : DEFAULT_PREFS.theme,
      size: SIZES.includes(p.size as TextSize) ? (p.size as TextSize) : DEFAULT_PREFS.size,
      calmMotion: p.calmMotion === true,
      focus: p.focus === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}
