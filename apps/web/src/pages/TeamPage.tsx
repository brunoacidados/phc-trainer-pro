import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, RefreshCw, Users } from "lucide-react";
import { BELTS } from "@phc/content";
import {
  aiKeyNames,
  type MemberSummary,
  type ProviderTestResultVM,
  type TeamDashboard,
} from "@phc/shared";
import { apiFetch } from "../lib/api.ts";
import { useSession } from "../stores/session.ts";
import { toast } from "../components/ui/toast.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input, Label } from "../components/ui/input.tsx";
import { Alert } from "../components/ui/alert.tsx";
import { ProgressBar } from "../components/ui/progress.tsx";
import { Table, TBody, TD, TH, THead, TR } from "../components/ui/table.tsx";
import { Spinner } from "../components/ui/misc.tsx";

interface ProviderStatusVM {
  id: string;
  nome: string;
  configured: boolean;
  source: string;
  paused?: boolean;
  hint?: string;
}

export function TeamPage() {
  const { team, user, refreshMe } = useSession();

  if (!team) return <NoTeam onDone={refreshMe} />;
  return (
    <TeamView teamId={team.id} isOwner={user?.role === "trainer"} userName={user?.name ?? ""} />
  );
}

function NoTeam({ onDone }: { onDone: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function create() {
    if (name.trim().length < 2) return;
    setBusy("create");
    try {
      await apiFetch("/api/teams", { method: "POST", body: { name: name.trim() } });
      await onDone();
      toast.success("Equipa criada! Partilhe o código de convite com os seus técnicos.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function join() {
    if (!code.trim()) return;
    setBusy("join");
    try {
      const r = await apiFetch<{ name: string }>("/api/teams/join", {
        method: "POST",
        body: { code: code.trim().toUpperCase() },
      });
      await onDone();
      toast.success(`Bem-vindo à equipa "${r.name}"! 🎓`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <Users className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-2 text-2xl font-bold">Progresso de equipa</h1>
        <p className="text-sm text-muted-foreground">
          O formador cria a equipa e partilha o código; cada técnico entra com o código e o
          progresso passa a ser comparável — sem trocar ficheiros JSON.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>🎓 Sou formador — criar equipa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Nome da equipa / empresa</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Técnicos ACME, Lda."
            />
            <Button
              className="w-full"
              loading={busy === "create"}
              disabled={name.trim().length < 2}
              onClick={() => void create()}
            >
              Criar equipa
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>👨‍💻 Sou técnico — entrar com código</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="join-code">Código de convite</Label>
            <Input
              id="join-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex.: K7M2QX9P"
              className="font-mono uppercase tracking-widest"
              maxLength={8}
            />
            <Button
              className="w-full"
              variant="secondary"
              loading={busy === "join"}
              disabled={!code.trim()}
              onClick={() => void join()}
            >
              Entrar na equipa
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeamView({
  teamId,
  isOwner,
  userName,
}: {
  teamId: string;
  isOwner: boolean;
  userName: string;
}) {
  const { team, refreshMe } = useSession();
  const qc = useQueryClient();
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, ProviderTestResultVM> | null>(null);
  const [testing, setTesting] = useState(false);

  async function testProviders() {
    setTesting(true);
    try {
      const r = await apiFetch<{ results: ProviderTestResultVM[]; ok: number; withKey: number }>(
        "/api/ai/test",
        {
          method: "POST",
          body: {},
        },
      );
      const map: Record<string, ProviderTestResultVM> = {};
      for (const x of r.results) map[x.id] = x;
      setTestResults(map);
      const okN = r.results.filter((x) => x.ok).length;
      if (r.withKey === 0)
        toast.error("Nenhuma chave configurada — cole as chaves da equipa primeiro.");
      else if (okN === 0) toast.error("Nenhum fornecedor respondeu — veja os erros abaixo.");
      else
        toast.success(`Teste concluído: ${okN}/${r.withKey} fornecedor(es) com chave a responder.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  const dash = useQuery({
    queryKey: ["team-dashboard", teamId],
    queryFn: () => apiFetch<TeamDashboard>(`/api/teams/${teamId}/dashboard`),
    enabled: isOwner,
    refetchInterval: 60_000,
  });

  const aiState = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => apiFetch<{ providers: ProviderStatusVM[] }>("/api/ai/providers"),
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle>
            <Users className="mr-2 inline h-4 w-4 text-primary" />
            {team?.name} · {team?.memberCount} membro(s)
          </CardTitle>
          {isOwner && team?.inviteCode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Código de convite:</span>
              <Badge variant="warning" className="font-mono text-sm tracking-widest">
                {team.inviteCode}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                title="Copiar"
                onClick={() => {
                  navigator.clipboard.writeText(team.inviteCode!);
                  toast.success("Código copiado!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Copiar link de convite"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/entrar/${team.inviteCode}`,
                  );
                  toast.success("Link de convite copiado!");
                }}
              >
                <Copy className="h-4 w-4 text-info" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Gerar novo código"
                onClick={async () => {
                  await apiFetch(`/api/teams/${teamId}/rotate-invite`, { method: "POST" });
                  await refreshMe();
                  toast.info("Novo código gerado — o anterior foi revogado.");
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isOwner && (
            <Alert variant="info">
              Está na equipa como <b>técnico</b>. O formador acompanha o seu progresso no painel
              dele. O seu resumo aparece na página Jornada.
            </Alert>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Painel da equipa (só o formador vê)</CardTitle>
          </CardHeader>
          <CardContent>
            {dash.isLoading ? (
              <Spinner />
            ) : dash.data ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Técnico</TH>
                    <TH>Cinto</TH>
                    <TH className="w-48">Progresso</TH>
                    <TH>🧠</TH>
                    <TH>Reps</TH>
                    <TH>Testes</TH>
                    <TH>Provas</TH>
                    <TH>🔥</TH>
                    <TH>XP</TH>
                    <TH>Última atividade</TH>
                  </TR>
                </THead>
                <TBody>
                  {dash.data.members.map((m: MemberSummary) => (
                    <TR
                      key={m.userId}
                      className={cnRow(m.name === userName)}
                      data-testid="member-row"
                    >
                      <TD>
                        <b>{m.name}</b>
                        {m.role === "trainer" && (
                          <Badge variant="warning" className="ml-2">
                            formador
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </TD>
                      <TD>
                        <span style={{ color: BELTS[m.belt]?.cor }}>🥋 {BELTS[m.belt]?.name}</span>
                      </TD>
                      <TD>
                        <ProgressBar value={m.pct} />
                      </TD>
                      <TD>{m.mastered}/90</TD>
                      <TD>{m.reps}</TD>
                      <TD>{m.quizzesPassed}/13</TD>
                      <TD>{m.evidences}</TD>
                      <TD>{m.streak}d</TD>
                      <TD>{m.xp}</TD>
                      <TD className="text-xs text-muted-foreground">
                        {m.lastActive ? new Date(m.lastActive).toLocaleString("pt-PT") : "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* chaves de IA da equipa */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle>
            <KeyRound className="mr-2 inline h-4 w-4 text-primary" />
            Fornecedores de IA {isOwner ? "(chaves da equipa — cifradas no servidor)" : "(estado)"}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            loading={testing}
            onClick={() => void testProviders()}
          >
            🔬 Testar todos
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info">
            As chaves ficam <b>só no servidor</b> (AES-256-GCM) — nunca chegam ao navegador. Todos
            os membros da equipa usam o auto-router (Groq → Gemini → NVIDIA → Mistral → Cerebras →
            OpenRouter). Sem CORS/proxy: a NVIDIA funciona direta a partir da API.
          </Alert>
          <div className="grid gap-2 md:grid-cols-2">
            {(aiState.data?.providers ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-border p-2"
              >
                <Badge variant={p.configured ? "success" : "muted"}>
                  {p.configured ? "✔" : "—"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.configured
                      ? `chave: ${p.source === "team" ? "equipa" : "servidor"} ${p.hint ?? ""}`
                      : "sem chave"}
                    {p.paused && " · em pausa (cooldown)"}
                  </div>
                  {testResults?.[p.id] && (
                    <div className="mt-1 text-xs">
                      {testResults[p.id].status === "sem-chave" ? (
                        <span className="text-muted-foreground">— sem chave</span>
                      ) : testResults[p.id].ok ? (
                        <span className="text-success">
                          ✔ respondeu em {testResults[p.id].ms} ms
                          {testResults[p.id].model ? ` · ${testResults[p.id].model}` : ""}
                        </span>
                      ) : (
                        <span className="text-destructive">
                          ✘{" "}
                          {testResults[p.id].httpStatus
                            ? `HTTP ${testResults[p.id].httpStatus} · `
                            : ""}
                          {testResults[p.id].error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isOwner && (
                  <Input
                    className="w-52"
                    type="password"
                    placeholder={p.configured ? "substituir chave…" : "colar chave…"}
                    value={keys[p.id] ?? ""}
                    onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button
                loading={savingKeys}
                disabled={!Object.values(keys).some(Boolean)}
                onClick={async () => {
                  setSavingKeys(true);
                  try {
                    await apiFetch(`/api/teams/${teamId}/ai-settings`, {
                      method: "PUT",
                      body: { keys },
                    });
                    setKeys({});
                    await qc.invalidateQueries({ queryKey: ["ai-providers"] });
                    toast.success("Chaves da equipa guardadas (cifradas).");
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setSavingKeys(false);
                  }
                }}
              >
                💾 Guardar chaves
              </Button>
              <p className="self-center text-xs text-muted-foreground">
                Campos vazios não alteram; para apagar uma chave envie um espaço. Voz (TTS) usa a
                chave Gemini / ElevenLabs (id <code>elevenlabs</code>).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cnRow(me: boolean): string {
  return me ? "bg-primary/5" : "";
}

export const AI_KEY_NAMES = aiKeyNames;
