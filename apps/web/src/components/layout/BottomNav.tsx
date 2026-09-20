import { NavLink } from "react-router-dom";
import { BarChart3, Brain, Library, Map, Target, Users } from "lucide-react";
import { cn } from "../../lib/utils.ts";
import { useI18n } from "../../i18n.tsx";

const ITEM_KEYS = [
  { to: "/", key: "nav.hoje", icon: Target, end: true },
  { to: "/missoes", key: "nav.missoes", icon: Map },
  { to: "/aprender", key: "nav.aprender", icon: Library },
  { to: "/praticar", key: "nav.praticar", icon: Brain },
  { to: "/progresso", key: "nav.progresso", icon: BarChart3 },
  { to: "/equipa", key: "nav.equipa", icon: Users },
];

/** Navegação inferior fixa — só em ecrãs pequenos (<md). */
export function BottomNav() {
  const { t } = useI18n();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {ITEM_KEYS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <it.icon className="h-5 w-5" />
            {t(it.key)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
