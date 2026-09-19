import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { apiFetch } from "../../lib/api.ts";
import { useSession } from "../../stores/session.ts";
import { Badge } from "../ui/badge.tsx";
import { cn } from "../../lib/utils.ts";

interface Notif {
  id: string;
  kind: string;
  severity: "info" | "warn" | "alert";
  text: string;
  href: string;
}

export function NotificationBell() {
  const user = useSession((s) => s.user);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<{ notifications: Notif[] }>("/api/notifications"),
    enabled: !!user,
    refetchInterval: 120_000,
  });
  const items = q.data?.notifications ?? [];
  const alerts = items.filter((i) => i.severity === "alert").length;

  return (
    <div className="relative">
      <button className="relative cursor-pointer rounded-md p-1.5 hover:bg-secondary/60" onClick={() => setOpen((o) => !o)} title="Notificações">
        <Bell className="h-4 w-4" />
        {items.length > 0 && (
          <span className={cn("absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold", alerts ? "bg-destructive text-white" : "bg-primary text-primary-foreground")}>
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <div className="border-b border-border px-3 py-2 text-sm font-semibold">Notificações</div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Tudo em dia! 🎉</p>}
              {items.map((n) => (
                <button
                  key={n.id}
                  className="flex w-full cursor-pointer items-start gap-2 border-b border-border/50 px-3 py-2 text-left text-sm hover:bg-secondary/40"
                  onClick={() => { setOpen(false); navigate(n.href); }}
                >
                  <Badge variant={n.severity === "alert" ? "destructive" : n.severity === "warn" ? "warning" : "info"}>{n.kind}</Badge>
                  <span className="flex-1">{n.text}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
