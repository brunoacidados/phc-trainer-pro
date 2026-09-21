import { useRef, useState } from "react";
import { COUNTRIES, SEGMENTS, VOICES, countryById } from "@phc/content";
import { applyCompanyText, changePasswordSchema } from "@phc/shared";
import { apiFetch } from "../lib/api.ts";
import { useSession } from "../stores/session.ts";
import { useProgress } from "../stores/progress.ts";
import { useTts } from "../hooks/useTts.ts";
import { useOnboard } from "../features/onboard/OnboardModal.tsx";
import { useI18n } from "../i18n.tsx";
import { toast } from "../components/ui/toast.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input, Label, Select, Textarea } from "../components/ui/input.tsx";
import { Alert } from "../components/ui/alert.tsx";
import { Dialog } from "../components/ui/dialog.tsx";
import { Spinner } from "../components/ui/misc.tsx";
import { cn } from "../lib/utils.ts";

export function SettingsPage() {
  const state = useProgress((s) => s.state);
  const store = useProgress.getState;
  const { user, refreshMe, logout } = useSession();
  const tts = useTts();
  const openWizard = useOnboard((s) => s.openWizard);
  const { lang, setLang } = useI18n();

  const [name, setName] = useState(user?.name ?? "");
  const [importOpen, setImportOpen] = useState(false);
  const [importTxt, setImportTxt] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!state) return <Spinner />;
  const s = state.settings;
  const country = countryById(state.contexto.pais);

  const voicesFor =
    s.ttsProvider === "gemini"
      ? VOICES.geminiVoices
      : s.ttsProvider === "elevenlabs"
        ? VOICES.elevenlabs
        : VOICES.groq;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">⚙️ Definições</h1>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
          <div>
            <b className="text-sm">🌐 Idioma / Language</b>
            <p className="text-xs text-muted-foreground">
              Interface (nav/labels). O conteúdo pedagógico mantém-se em PT.
            </p>
          </div>
          <select
            className="rounded-md border border-input bg-background/60 px-2 py-1.5 text-sm"
            value={lang}
            onChange={(e) => setLang(e.target.value as "pt" | "en")}
          >
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
        </CardContent>
      </Card>

      {/* perfil */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <Button
            disabled={name === user?.name || name.trim().length < 2}
            onClick={async () => {
              await apiFetch("/api/auth/me", { method: "PATCH", body: { name: name.trim() } });
              await refreshMe();
              toast.success("Perfil atualizado.");
            }}
          >
            Guardar
          </Button>
          <Button variant="outline" onClick={() => setPwOpen(true)}>
            🔑 Alterar palavra-passe
          </Button>
          <Button variant="outline" onClick={() => openWizard()}>
            🎓 Refazer entrevista de curso
          </Button>
        </CardContent>
      </Card>

      {/* contexto país/gama */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 Contexto de implementação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label>País</Label>
              <Select
                className="w-44"
                value={state.contexto.pais}
                onChange={(e) => void store().setContexto(e.target.value, state.contexto.gama)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ico} {c.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Gama</Label>
              <Select
                className="w-44"
                value={state.contexto.gama}
                onChange={(e) => void store().setContexto(state.contexto.pais, e.target.value)}
              >
                {["Corporate", "Advanced", "Enterprise"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </div>
          </div>
          {country && (
            <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
              <div>
                <b className="text-foreground">
                  Obrigações fiscais ({country.nome}, {country.moeda}):
                </b>
                <ul className="list-disc pl-4">
                  {country.fiscal.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <b className="text-foreground">Particularidades do software:</b>
                <ul className="list-disc pl-4">
                  {country.phc.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* empresa de treino */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 Empresa de treino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {SEGMENTS.map((seg) => (
              <button
                key={seg.id}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 text-left transition-colors",
                  state.company?.segId === seg.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40",
                )}
                onClick={() => void store().setCompany(seg.id)}
              >
                <div className="text-xl">{seg.ico}</div>
                <div className="text-sm font-medium">{seg.nome}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{seg.desc}</div>
              </button>
            ))}
          </div>
          <Alert variant="info">
            Empresa atual:{" "}
            <b>
              {state.company?.segIco} {state.company?.nome}
            </b>{" "}
            ({state.company?.cidade}) · NIF {state.company?.nif} · CAE {state.company?.cae}. Os
            textos das missões e da IA adaptam-se automaticamente. Ex.:{" "}
            {applyCompanyText("Criar o cliente CLIENTE MODELO, LDA com NIF válido", state.company)}.
          </Alert>
        </CardContent>
      </Card>

      {/* voz */}
      <Card>
        <CardHeader>
          <CardTitle>🔊 Voz do Professor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#f5a623]"
              checked={s.tts}
              onChange={(e) => void store().updateSettings({ tts: e.target.checked })}
            />
            Voz ativa
          </label>
          <div className="flex flex-wrap gap-3">
            <div>
              <Label>Provedor</Label>
              <Select
                className="w-64"
                value={s.ttsProvider}
                onChange={(e) =>
                  void store().updateSettings({
                    ttsProvider: e.target.value as typeof s.ttsProvider,
                    ttsTouched: true,
                  })
                }
              >
                <option value="gemini">🇧🇷 Gemini TTS (padrão — voz natural)</option>
                <option value="elevenlabs">🎙 ElevenLabs (premium)</option>
                <option value="browser">🖥 Navegador (voz robótica — só offline)</option>
                <option value="groq">⚡ Groq Orpheus (só inglês — evitar em PT)</option>
              </Select>
            </div>
            {s.ttsProvider !== "browser" && (
              <div>
                <Label>Voz</Label>
                <Select
                  className="w-64"
                  value={
                    s.ttsProvider === "gemini"
                      ? s.gmVoice
                      : s.ttsProvider === "elevenlabs"
                        ? s.elVoice
                        : s.grVoice
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    void store().updateSettings(
                      s.ttsProvider === "gemini"
                        ? { gmVoice: v, ttsTouched: true }
                        : s.ttsProvider === "elevenlabs"
                          ? { elVoice: v, ttsTouched: true }
                          : { grVoice: v, ttsTouched: true },
                    );
                  }}
                >
                  {voicesFor.map(([label, id]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {s.ttsProvider === "gemini" && (
              <div>
                <Label>Modelo TTS</Label>
                <Select
                  className="w-72"
                  value={s.gmModel}
                  onChange={(e) =>
                    void store().updateSettings({ gmModel: e.target.value, ttsTouched: true })
                  }
                >
                  {VOICES.geminiModels.map(([label, id]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label>Velocidade (voz do navegador): {s.rate.toFixed(1)}×</Label>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.1}
                value={s.rate}
                className="w-44 accent-[#f5a623]"
                onChange={(e) => void store().updateSettings({ rate: Number(e.target.value) })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#f5a623]"
              checked={s.ttsFallback}
              onChange={(e) => void store().updateSettings({ ttsFallback: e.target.checked })}
            />
            Fallback automático para a voz do navegador se a cloud falhar
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void tts.speak("Olá! Sou o Professor Einstein. Vamos treinar PHC juntos?")
            }
          >
            ▶ Testar voz
          </Button>
          <p className="text-xs text-muted-foreground">
            Padrão: <b>Gemini TTS</b> com a voz <b>Charon</b> (masculina, informativa) — voz natural
            em português. A voz do navegador é robótica e serve apenas de recurso offline. O Gemini
            usa a chave configurada no servidor/equipa (AI_KEY_GEMINI).
          </p>
        </CardContent>
      </Card>

      {/* treino */}
      <Card>
        <CardHeader>
          <CardTitle>🎓 Treino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#f5a623]"
              checked={s.freeMode}
              onChange={(e) => void store().updateSettings({ freeMode: e.target.checked })}
            />
            Modo livre (todas as missões destrancadas — para consulta/formação de equipa)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#f5a623]"
              checked={s.economy}
              onChange={(e) => void store().updateSettings({ economy: e.target.checked })}
            />
            Modo económico (desliga a IA; explicações só com texto original + voz)
          </label>
        </CardContent>
      </Card>

      {/* dados */}
      <Card>
        <CardHeader>
          <CardTitle>💾 Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([JSON.stringify(state, null, 1)], {
                  type: "application/json",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `phc-trainer-progresso-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              ⬇ Exportar progresso (JSON)
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              ⬆ Importar do app legado
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const rows = [["Data", "Missao", "Tipo", "Descricao"]];
                for (const e of state.evid)
                  rows.push([e.d, e.lab, e.kind, String(e.txt).replace(/;/g, ",")]);
                const blob = new Blob([rows.map((r) => r.join(";")).join("\n")], {
                  type: "text/csv;charset=utf-8",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `phc-trainer-provas-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              📸 Exportar provas (CSV)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setImportTxt(await f.text());
                setImportOpen(true);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O progresso vive agora na <b>sua conta</b> (servidor) — acessível em qualquer
            dispositivo. A importação aceita o JSON exportado pelo PWA legado (v3–v5.3); chaves de
            IA antigas são descartadas (as novas ficam na equipa).
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Apagar TODO o progresso desta conta? (a conta e a equipa mantêm-se)")) {
                void store()
                  .resetProgress()
                  .then(() => toast.info("Progresso reposto."));
              }
            }}
          >
            🗑 Repor progresso
          </Button>
        </CardContent>
      </Card>

      {/* sessão */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Sessão: <Badge variant="success">{user?.email}</Badge> · papel:{" "}
            {user?.role === "trainer" ? "formador" : "técnico"}
          </div>
          <Button variant="outline" onClick={() => void logout()}>
            Terminar sessão
          </Button>
        </CardContent>
      </Card>

      {/* dialog importar */}
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="⬆ Importar progresso do app legado"
        wide
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No PWA antigo: ⚙️ Definições → 💾 Exportar → cole aqui o conteúdo do JSON (ou escolha o
            ficheiro).
          </p>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            📁 Escolher ficheiro…
          </Button>
          <Textarea
            rows={8}
            className="font-mono text-xs"
            value={importTxt}
            onChange={(e) => setImportTxt(e.target.value)}
            placeholder='{"labs":{...},"cards":{...}}'
          />
          <Button
            disabled={!importTxt.trim()}
            onClick={async () => {
              try {
                const r = await store().importLegacy(importTxt);
                toast.success(
                  `Importado: ${r.labs} missões, ${r.cards} cartas, ${r.evidences} provas, ${r.achievements} conquistas.`,
                );
                setImportOpen(false);
                setImportTxt("");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Importar
          </Button>
        </div>
      </Dialog>

      {/* dialog password */}
      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title="🔑 Alterar palavra-passe">
      <div className="space-y-3">
        {err && <Alert variant="destructive">{err}</Alert>}
        <div>
          <Label>Palavra-passe atual</Label>
          <Input
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <Label>Nova palavra-passe (mín. 8)</Label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button
          className="w-full"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              changePasswordSchema.parse({ currentPassword: cur, newPassword: next });
              await apiFetch("/api/auth/change-password", {
                method: "POST",
                body: { currentPassword: cur, newPassword: next },
              });
              toast.success("Palavra-passe alterada. Volte a entrar.");
              onClose();
            } catch (e) {
              setErr((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Alterar
        </Button>
      </div>
    </Dialog>
  );
}
