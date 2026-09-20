import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "../lib/api.ts";
import { useSession } from "../stores/session.ts";

/** Liga-se ao SSE /api/events e refresca queries da equipa/notificações em tempo real. */
export function useRealtime() {
  const qc = useQueryClient();
  const user = useSession((s) => s.user);
  useEffect(() => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["team-dashboard"] });
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
    };
    es.addEventListener("progress", refresh);
    es.addEventListener("assignment", refresh);
    es.onerror = () => { /* reconecta automático (EventSource) */ };
    return () => es.close();
  }, [user, qc]);
}
