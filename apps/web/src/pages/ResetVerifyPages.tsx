import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api.ts";
import { Button } from "../components/ui/button.tsx";
import { Input, Label } from "../components/ui/input.tsx";
import { Alert } from "../components/ui/alert.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { StrengthMeter, passwordStrength } from "../components/ui/PasswordStrength.tsx";

/** /resetar?token=... — define nova password após "esqueci-me" */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit() {
    setErr(null);
    if (pw.length < 8) return setErr("Mínimo 8 caracteres.");
    if (pw !== pw2) return setErr("As passwords não coincidem.");
    setBusy(true);
    try {
      const r = await apiFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword: pw },
        noRetry: true,
      });
      setMsg(r.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-accent">🔑 Repor password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!token && (
            <Alert variant="destructive">Link inválido: falta o token. Use o link do email.</Alert>
          )}
          {msg && <Alert variant="success">{msg}</Alert>}
          {err && <Alert variant="destructive">{err}</Alert>}
          <div>
            <Label htmlFor="np">Nova password (mín. 8)</Label>
            <Input
              id="np"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
            />
            <StrengthMeter pw={pw} />
          </div>
          <div>
            <Label htmlFor="np2">Confirmar nova password</Label>
            <Input
              id="np2"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button
            className="w-full"
            disabled={!token || busy || passwordStrength(pw).score < 2}
            loading={busy}
            onClick={() => void submit()}
          >
            Repor password
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link className="text-info hover:underline" to="/login">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** /verificar?token=... — confirma o email */
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"loading" | "ok" | "erro">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetch<{ message: string }>(`/api/auth/verify/${token}`, {
          noRetry: true,
        });
        if (!cancelled) {
          setMsg(r.message);
          setState("ok");
        }
      } catch (e) {
        if (!cancelled) {
          setMsg((e as Error).message);
          setState("erro");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-accent">✉️ Verificação de email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          {state === "loading" && <p className="text-sm text-muted-foreground">A verificar…</p>}
          {state === "ok" && <Alert variant="success">{msg}</Alert>}
          {state === "erro" && (
            <Alert variant="destructive">
              {msg}
              <div className="mt-1 text-xs">
                Se o link expirou, peça um novo email (Reenviar) ou contacte o formador/admin — ele
                pode verificar manualmente ou gerar um link em Admin.
              </div>
            </Alert>
          )}
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Ir para o login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
