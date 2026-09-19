import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Brain,
  GraduationCap,
  Library,
  LogOut,
  Map,
  Search,
  Settings,
  Target,
  Users,
  ShieldAlert,
} from "lucide-react";
import { BELTS } from "@phc/content";
import { currentBelt, xpTotal } from "@phc/shared";
import { useSession } from "../../stores/session.ts";
import { useUi } from "../../stores/ui.ts";
import { useProgress } from "../../stores/progress.ts";
import { Badge } from "../ui/badge.tsx";
import { Button } from "../ui/button.tsx";
import { cn } from "../../lib/utils.ts";
import { useSync } from "../../stores/sync.ts";
import { NotificationBell } from "./NotificationBell.tsx";
import { useTheme } from "../../stores/theme.ts";
import { usePwaInstall } from "../../hooks/usePwaInstall.ts";
import { Download, Moon, Sun } from "lucide-react";

const NAV = [
  { to: "/", label: "Jornada", icon: Target, end: true },
  { to: "/missoes", label: "Missões", icon: Map },
  { to: "/aprender", label: "Aprender", icon: Library },
  { to: "/praticar", label: "Praticar", icon: Brain },
  { to: "/progresso", label: "Progresso", icon: BarChart3 },
  { to: "/equipa", label: "Equipa", icon: Users },
  { to: "/definicoes", label: "Definições", icon: Settings },
];

function SyncIndicator() {
  const online = useSync((s) => s.online);
  const pending = useSync((s) => s.pending);
  const syncing = useSync((s) => s.syncing);
  const drain = useSync((s) => s.drain);
  if (online && pending === 0) return null;
  return (
    <span className="flex items-center gap-1.5">
      {!online && (
        <Badge variant="destructive" title="Sem ligação — as ações ficam guardadas no dispositivo">
          📴 Offline
        </Badge>
      )}
      {pending > 0 && (
        <button onClick={() => void drain()} title="Sincronizar agora" className="cursor-pointer">
          <Badge variant="warning">
            {syncing ? "↻ a sincronizar…" : `☁️ ${pending} pendente(s) · sincronizar`}
          </Badge>
        </button>
      )}
    </span>
  );
}

export function AppHeader() {
  const { user, logout } = useSession();
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const { canInstall, promptInstall } = usePwaInstall();
  const nav = user?.role === "admin" ? [...NAV, { to: "/admin", label: "Admin", icon: ShieldAlert }] : NAV;
  const state = useProgress((s) => s.state);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void useProgress.getState().load(user.id);
  }, [user]);

  const belt = state ? BELTS[currentBelt(state)] : null;
  const xp = state ? xpTotal(state) : 0;
  const streak = state?.streak.n ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#101728]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-[#f5ecd6] text-xl">
            🧠
          </div>
          <div>
            <div className="text-base font-extrabold tracking-wide text-primary">
              PHC TRAINER PRO
            </div>
            <div className="text-[11px] text-muted-foreground">
              Formação em equipa · <b>Gestão</b> Cegid PHC Evolution
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => useUi.getState().setPalette(true)}
            title="Pesquisar (Ctrl/⌘+K)"
          >
            <Search className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline text-muted-foreground">Pesquisar</span>
            <kbd className="ml-1.5 hidden rounded border border-border px-1 text-[10px] text-muted-foreground md:inline">
              ⌘K
            </kbd>
          </Button>
          {canInstall && (
            <Button variant="outline" size="sm" title="Instalar aplicação" onClick={() => void promptInstall()}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title={theme === "dark" ? "Tema claro" : "Tema escuro"} onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <NotificationBell />
          <SyncIndicator />
          {state && (
            <>
              <Badge variant="warning" title="Dias consecutivos">
                🔥 {streak}d
              </Badge>
              <Badge variant="info" title="XP">
                {xp} XP
              </Badge>
              {belt && (
                <Badge variant="secondary" title="Nível atual">
                  <GraduationCap className="mr-1 h-3 w-3" /> {belt.name}
                </Badge>
              )}
            </>
          )}
          <span
            className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:inline"
            title={user?.email}
          >
            {user?.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            title="Terminar sessão"
            onClick={async () => {
              await logout();
              useProgress.getState().reset();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )
            }
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4">
        PHC Trainer Pro v6 (multiutilizador) · material educativo não oficial — Cegid PHC® é marca
        dos respetivos proprietários ·{" "}
        <a
          className="text-info hover:underline"
          href="https://github.com/brunoacidados/phc-trainer-pro"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>{" "}
        · progresso guardado na sua conta (servidor)
      </div>
    </footer>
  );
}
