import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, UserX, UserCheck, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { useSession } from "../stores/session.ts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { Table, TBody, TD, TH, THead, TR } from "../components/ui/table.tsx";
import { toast } from "../components/ui/toast.tsx";
import { Spinner } from "../components/ui/misc.tsx";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  teamName: string | null;
  emailVerified: boolean;
  deactivated: boolean;
  group: string;
  lastActiveAt: string | null;
  createdAt: string;
}

interface Analytics {
  total: number;
  active7: number;
  active1: number;
  teams: number;
  verified: number;
  signups: { _id: string; n: number }[];
}

/** /admin — gestão global (apenas role=admin, definido via ADMIN_EMAIL) */
export function AdminPage() {
  const user = useSession((s) => s.user);
  const qc = useQueryClient();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<{ users: AdminUser[] }>("/api/admin/users"),
    enabled: user?.role === "admin",
  });
  const stats = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiFetch<Analytics>("/api/admin/analytics"),
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <ShieldAlert className="mx-auto mb-2 h-8 w-8" />
          Área reservada a administradores.
        </CardContent>
      </Card>
    );
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["admin-analytics"] });
  };

  const act = async (id: string, action: "deactivate" | "activate" | "delete") => {
    try {
      if (action === "delete") await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      else await apiFetch(`/api/admin/users/${id}/${action}`, { method: "POST" });
      toast.success(action === "delete" ? "Conta apagada." : action === "activate" ? "Conta reativada." : "Conta desativada.");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">🛡 Administração</h1>

      {stats.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Utilizadores", stats.data.total],
            ["Ativos 24h", stats.data.active1],
            ["Ativos 7d", stats.data.active7],
            ["Equipas", stats.data.teams],
            ["Emails verificados", stats.data.verified],
          ].map(([l, v]) => (
            <Card key={String(l)}>
              <CardContent className="py-3 text-center">
                <div className="text-xl font-bold">{v}</div>
                <div className="text-[11px] text-muted-foreground">{l}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats.data?.signups?.length ? (
        <Card>
          <CardHeader><CardTitle>📈 Registos (14 dias)</CardTitle></CardHeader>
          <CardContent className="flex items-end gap-1">
            {stats.data.signups.map((s) => (
              <div key={s._id} className="flex-1 text-center">
                <div className="mx-auto w-full rounded-t bg-primary/70" style={{ height: `${Math.max(4, s.n * 12)}px` }} />
                <div className="mt-1 text-[9px] text-muted-foreground">{s._id.slice(5)}</div>
                <div className="text-[10px] font-semibold">{s.n}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>👥 Utilizadores ({users.data?.users.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {users.isLoading ? (
            <Spinner />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Nome</TH><TH>Email</TH><TH>Papel</TH><TH>Equipa</TH><TH>Grupo</TH><TH>Estado</TH><TH>Últ. atividade</TH><TH className="w-28" />
                </TR>
              </THead>
              <TBody>
                {(users.data?.users ?? []).map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.name}</TD>
                    <TD className="text-xs text-muted-foreground">{u.email}</TD>
                    <TD><Badge variant={u.role === "admin" ? "warning" : u.role === "trainer" ? "info" : "muted"}>{u.role}</Badge></TD>
                    <TD className="text-xs">{u.teamName ?? "—"}</TD>
                    <TD className="text-xs">{u.group || "—"}</TD>
                    <TD>
                      {u.deactivated ? <Badge variant="destructive">desativada</Badge> : u.emailVerified ? <Badge variant="success">verificada</Badge> : <Badge variant="muted">por verificar</Badge>}
                    </TD>
                    <TD className="text-xs text-muted-foreground">{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString("pt-PT") : "—"}</TD>
                    <TD>
                      <div className="flex gap-1">
                        {u.deactivated ? (
                          <Button size="icon" variant="ghost" title="Reativar" onClick={() => void act(u.id, "activate")}><UserCheck className="h-4 w-4 text-success" /></Button>
                        ) : (
                          <Button size="icon" variant="ghost" title="Desativar" onClick={() => void act(u.id, "deactivate")}><UserX className="h-4 w-4 text-warning" /></Button>
                        )}
                        {confirmDel === u.id ? (
                          <Button size="sm" variant="destructive" onClick={() => { setConfirmDel(null); void act(u.id, "delete"); }}>Confirmar?</Button>
                        ) : (
                          <Button size="icon" variant="ghost" title="Apagar" onClick={() => setConfirmDel(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
