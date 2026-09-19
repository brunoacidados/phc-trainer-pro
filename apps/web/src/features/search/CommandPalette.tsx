import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Library,
  Map,
  Search,
  Target,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";
import { CIRCUITS, GLOSSARY, LABS } from "@phc/content";
import { applyCompanyText, encSearchAll } from "@phc/shared";
import { useProgress } from "../../stores/progress.ts";
import { Badge } from "../../components/ui/badge.tsx";
import { cn } from "../../lib/utils.ts";

interface Item {
  id: string;
  group: string;
  title: string;
  sub?: string;
  icon: React.ReactNode;
  run: () => void;
}

const NAV: Omit<Item, "id" | "group">[] = [
  { title: "Jornada (hoje)", icon: <Target className="h-4 w-4" />, run: () => {} },
  { title: "Missões", icon: <Map className="h-4 w-4" />, run: () => {} },
  { title: "Aprender", icon: <Library className="h-4 w-4" />, run: () => {} },
  { title: "Praticar (cartas/testes)", icon: <Brain className="h-4 w-4" />, run: () => {} },
  { title: "Progresso", icon: <BookOpen className="h-4 w-4" />, run: () => {} },
  { title: "Equipa", icon: <Users className="h-4 w-4" />, run: () => {} },
  { title: "Definições", icon: <SettingsIcon className="h-4 w-4" />, run: () => {} },
];
const NAV_ROUTES = [
  "/",
  "/missoes",
  "/aprender",
  "/praticar",
  "/progresso",
  "/equipa",
  "/definicoes",
];

/** Command Palette (Ctrl/Cmd+K) — pesquisa global + navegação rápida */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();
  const state = useProgress((s) => s.state);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const go = useCallback(
    (path: string) => {
      onClose();
      navigate(path);
    },
    [onClose, navigate],
  );

  const items = useMemo<Item[]>(() => {
    const low = q.trim().toLowerCase();
    const out: Item[] = [];
    const emp = (t: string) => (state ? applyCompanyText(t, state.company) : t);

    // navegação (sempre visível; filtrado se houver query)
    NAV.forEach((n, i) => {
      if (!low || n.title.toLowerCase().includes(low)) {
        out.push({ id: `nav-${i}`, group: "Ir para", ...n, run: () => go(NAV_ROUTES[i]) });
      }
    });

    if (low.length >= 2) {
      // missões
      for (const l of LABS) {
        const t = emp(l.t);
        if (
          l.id.toLowerCase().includes(low) ||
          t.toLowerCase().includes(low) ||
          l.goal.toLowerCase().includes(low)
        ) {
          out.push({
            id: `lab-${l.id}`,
            group: "Missões",
            title: `${l.id} · ${t}`,
            sub: l.goal.slice(0, 70),
            icon: <Map className="h-4 w-4" />,
            run: () => go(`/missoes/${l.id}`),
          });
        }
        if (out.filter((x) => x.group === "Missões").length >= 6) break;
      }
      // dicionário
      for (const g of GLOSSARY) {
        if (g.t.toLowerCase().includes(low) || g.d.toLowerCase().includes(low)) {
          out.push({
            id: `dict-${g.t}`,
            group: "Dicionário",
            title: g.t,
            sub: g.d.slice(0, 70),
            icon: <BookOpen className="h-4 w-4" />,
            run: () => go(`/aprender?tab=dicionario&q=${encodeURIComponent(g.t)}`),
          });
        }
        if (out.filter((x) => x.group === "Dicionário").length >= 5) break;
      }
      // enciclopédia (busca global)
      for (const h of encSearchAll(low, 6)) {
        out.push({
          id: `enc-${h.tag}-${h.n}`,
          group: "Enciclopédia",
          title: h.n,
          sub: `${h.tag}${h.d ? " · " + h.d.slice(0, 60) : ""}`,
          icon: <Library className="h-4 w-4" />,
          run: () => go(`/aprender?tab=enciclopedia&q=${encodeURIComponent(h.n)}`),
        });
      }
      // circuitos
      for (const c of CIRCUITS) {
        if (c.t.toLowerCase().includes(low) || c.d.toLowerCase().includes(low)) {
          out.push({
            id: `circ-${c.id}`,
            group: "Circuitos",
            title: `${c.ico} ${c.t}`,
            sub: c.d.slice(0, 70),
            icon: <Target className="h-4 w-4" />,
            run: () => go(`/aprender?tab=circuitos`),
          });
        }
      }
    }
    return out.slice(0, 40);
  }, [q, state, go]);

  useEffect(() => {
    setSel(0);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        items[sel]?.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, sel, onClose]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="paletteWrap fixed inset-0 z-[1300] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Pesquisa global"
        className="palettePanel relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar missões, dicionário, enciclopédia, circuitos… ou navegar"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Badge variant="muted" className="hidden sm:inline">
            ESC
          </Badge>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nada encontrado para “{q}”.
            </p>
          )}
          {items.map((it, i) => {
            const showGroup = it.group !== lastGroup;
            lastGroup = it.group;
            return (
              <div key={it.id}>
                {showGroup && (
                  <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {it.group}
                  </div>
                )}
                <button
                  data-idx={i}
                  onClick={it.run}
                  onMouseEnter={() => setSel(i)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left",
                    sel === i ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-secondary/50",
                  )}
                >
                  <span className="text-muted-foreground">{it.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{it.title}</span>
                    {it.sub && (
                      <span className="block truncate text-xs text-muted-foreground">{it.sub}</span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ navegar · ⏎ abrir · ESC fechar</span>
          <span>Ctrl/⌘ + K</span>
        </div>
      </div>
    </div>
  );
}
