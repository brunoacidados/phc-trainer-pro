import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "pt" | "en";
const DICT: Record<Lang, Record<string, string>> = {
  pt: {
    "nav.hoje": "Hoje",
    "nav.missoes": "Missões",
    "nav.aprender": "Aprender",
    "nav.praticar": "Praticar",
    "nav.progresso": "Progresso",
    "nav.cursos": "Cursos",
    "nav.equipa": "Equipa",
    "nav.definicoes": "Definições",
    "nav.admin": "Admin",
    "common.install": "Instalar aplicação",
    "common.theme": "Tema",
    "common.search": "Pesquisar",
  },
  en: {
    "nav.hoje": "Today",
    "nav.missoes": "Missions",
    "nav.aprender": "Learn",
    "nav.praticar": "Practice",
    "nav.progresso": "Progress",
    "nav.cursos": "Courses",
    "nav.equipa": "Team",
    "nav.definicoes": "Settings",
    "nav.admin": "Admin",
    "common.install": "Install app",
    "common.theme": "Theme",
    "common.search": "Search",
  },
};

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: "pt",
  setLang: () => {},
  t: (k) => DICT.pt[k] ?? k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("phc.lang") as Lang) || "pt"; } catch { return "pt"; }
  });
  const set = (l: Lang) => { try { localStorage.setItem("phc.lang", l); } catch {} setLang(l); };
  const t = (k: string) => DICT[lang][k] ?? DICT.pt[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang: set, t }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
