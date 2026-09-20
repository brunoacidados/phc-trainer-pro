import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, UserX, UserCheck, Trash2, KeyRound, MailCheck } from "lucide-react";
import { Dialog } from "../components/ui/dialog.tsx";
import { Alert } from "../components/ui/alert.tsx";
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
  const [recovery, setRecovery] = useState<{ label: string; value: string } | null>(null);

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<{ users: AdminUser[] }>("/api/admin/users"),
    enabled: user?.role === "admin",
  });
  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () =>
      apiFetch<{
        items: {
          _id: string;
          actorEmail: string;
          action: string;
          targetId: string;
          createdAt: string;
        }[];
        total: number;
      }>("/api/admin/audit?limit=20"),
    enabled: user?.role === "admin",
  });
  const emailSt = useQuery({
    queryKey: ["admin-email"],
    queryFn: () =>
      apiFetch<{
        warning: string | null;
        resendConfigured: boolean;
        appUrl: string;
        emailFrom: string;
        appUrlIsLocal: boolean;
        fromIsResendDefault: boolean;
      }>("/api/admin/email-status"),
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

  const recover = async (id: string, kind: "verify" | "reset-link" | "temp-password") => {
    try {
      if (kind === "verify") {
        await apiFetch(`/api/admin/users/${id}/verify`, { method: "POST" });
        toast.success("Email marcado como verificado.");
        refresh();
        return;
      }
      const r =
        kind === "reset-link"
          ? await apiFetch<{ link: string }>(`/api/admin/users/${id}/reset-link`, {
              method: "POST",
            })
          : await apiFetch<{ tempPassword: string }>(`/api/admin/users/${id}/temp-password`, {
              method: "POST",
            });
      setRecovery(
        kind === "reset-link"
          ? {
              label: "Link de reset (válido 60min) — envie ao utilizador",
              value: (r as { link: string }).link,
            }
          : {
              label: "Password temporária — o utilizador deve alterá-la após entrar",
              value: (r as { tempPassword: string }).tempPassword,
            },
      );
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const act = async (id: string, action: "deactivate" | "activate" | "delete") => {
    try {
      if (action === "delete") await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      else await apiFetch(`/api/admin/users/${id}/${action}`, { method: "POST" });
      toast.success(
        action === "delete"
          ? "Conta apagada."
          : action === "activate"
            ? "Conta reativada."
            : "Conta desativada.",
      );
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

      {emailSt.data && (
        <Card className={emailSt.data.warning ? "border-warning/60" : "border-success/50"}>
          <CardHeader>
            <CardTitle>📧 Estado do email (recuperação/verificação)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!emailSt.data.warning ? (
              <Alert variant="success">
                Configuração de email OK — recuperação e verificação a enviar normalmente.
              </Alert>
            ) : (
              <Alert variant="warning">
                <b>Os emails NÃO estão a sair corretamente:</b> {emailSt.data.warning}
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {!emailSt.data.resendConfigured && (
                    <li>
                      Defina <code>RESEND_API_KEY</code> no Render (resend.com, free).
                    </li>
                  )}
                  {emailSt.data.appUrlIsLocal && (
                    <li>
                      Defina <code>APP_URL</code> = URL público da web (ex.:
                      https://phc-trainer-pro-web.vercel.app) — senão os links vão para localhost.
                    </li>
                  )}
                  {emailSt.data.fromIsResendDefault && (
                    <li>
                      Verifique um domínio no Resend e defina <code>EMAIL_FROM</code> ={" "}
                      <code>algo@oteudominio.com</code> (o default só envia p/ o dono da conta).
                    </li>
                  )}
                </ul>
                <p className="mt-2 text-xs">
                  Entretanto, pode recuperar qualquer conta manualmente abaixo (🔑 link de reset / 🛡
                  password temporária / ✉ verificar).
                </p>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              APP_URL: {emailSt.data.appUrl} · FROM: {emailSt.data.emailFrom}
            </p>
          </CardContent>
        </Card>
      )}

      {stats.data?.signups?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>📈 Registos (14 dias)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-1">
            {stats.data.signups.map((s) => (
              <div key={s._id} className="flex-1 text-center">
                <div
                  className="mx-auto w-full rounded-t bg-primary/70"
                  style={{ height: `${Math.max(4, s.n * 12)}px` }}
                />
                <div className="mt-1 text-[9px] text-muted-foreground">{s._id.slice(5)}</div>
                <div className="text-[10px] font-semibold">{s.n}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>👥 Utilizadores ({users.data?.users.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.isLoading ? (
            <Spinner />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Nome</TH>
                  <TH>Email</TH>
                  <TH>Papel</TH>
                  <TH>Equipa</TH>
                  <TH>Grupo</TH>
                  <TH>Estado</TH>
                  <TH>Últ. atividade</TH>
                  <TH className="w-28" />
                </TR>
              </THead>
              <TBody>
                {(users.data?.users ?? []).map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.name}</TD>
                    <TD className="text-xs text-muted-foreground">{u.email}</TD>
                    <TD>
                      <Badge
                        variant={
                          u.role === "admin" ? "warning" : u.role === "trainer" ? "info" : "muted"
                        }
                      >
                        {u.role}
                      </Badge>
                    </TD>
                    <TD className="text-xs">{u.teamName ?? "—"}</TD>
                    <TD className="text-xs">{u.group || "—"}</TD>
                    <TD>
                      {u.deactivated ? (
                        <Badge variant="destructive">desativada</Badge>
                      ) : u.emailVerified ? (
                        <Badge variant="success">verificada</Badge>
                      ) : (
                        <Badge variant="muted">por verificar</Badge>
                      )}
                    </TD>
                    <TD className="text-xs text-muted-foreground">
                      {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString("pt-PT") : "—"}
                    </TD>
                    <TD>
                      <div className="flex gap-1">
                        {u.deactivated ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Reativar"
                            onClick={() => void act(u.id, "activate")}
                          >
                            <UserCheck className="h-4 w-4 text-success" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Desativar"
                            onClick={() => void act(u.id, "deactivate")}
                          >
                            <UserX className="h-4 w-4 text-warning" />
                          </Button>
                        )}
                        {!u.emailVerified && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Marcar email verificado"
                            onClick={() => void recover(u.id, "verify")}
                          >
                            <MailCheck className="h-4 w-4 text-info" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Gerar link de reset"
                          onClick={() => void recover(u.id, "reset-link")}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Password temporária"
                          onClick={() => void recover(u.id, "temp-password")}
                        >
                          <ShieldAlert className="h-4 w-4 text-warning" />
                        </Button>
                        {confirmDel === u.id ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setConfirmDel(null);
                              void act(u.id, "delete");
                            }}
                          >
                            Confirmar?
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Apagar"
                            onClick={() => setConfirmDel(u.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      {audit.data && audit.data.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📜 Auditoria (ações de admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Quando</TH>
                  <TH>Admin</TH>
                  <TH>Ação</TH>
                  <TH>Alvo</TH>
                </TR>
              </THead>
              <TBody>
                {audit.data.items.map((a) => (
                  <TR key={a._id}>
                    <TD className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString("pt-PT")}
                    </TD>
                    <TD className="text-xs">{a.actorEmail}</TD>
                    <TD>
                      <Badge variant="warning">{a.action}</Badge>
                    </TD>
                    <TD className="text-xs text-muted-foreground">{a.targetId.slice(0, 8)}…</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!recovery} onClose={() => setRecovery(null)} title="🔑 Recuperação">
        {recovery && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{recovery.label}</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-secondary/50 p-2 text-xs">
                {recovery.value}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(recovery.value);
                  toast.success("Copiado!");
                }}
              >
                Copiar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
