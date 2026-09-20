import { useState } from "react";
import { apiFetch } from "../lib/api.ts";
import { Dialog } from "../components/ui/dialog.tsx";
import { buttonVariants } from "../components/ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { StrengthMeter, passwordStrength } from "../components/ui/PasswordStrength.tsx";

import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@phc/shared";
import type { z } from "zod";
import { useSession } from "../stores/session.ts";
import { Button } from "../components/ui/button.tsx";
import { Input, Label } from "../components/ui/input.tsx";
import { Alert } from "../components/ui/alert.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";

function Shell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-[#f5ecd6] text-3xl">
            🧠
          </div>
          <h1 className="text-xl font-extrabold tracking-wide text-primary">PHC TRAINER PRO</h1>
          <p className="text-sm text-muted-foreground">
            Formação prática em equipa · Gestão Cegid PHC Evolution
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-accent">{title}</CardTitle>
            <CardDescription>{sub}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LoginPage() {
  const login = useSession((s) => s.login);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotLink, setForgotLink] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const from = (location.state as { from?: string } | null)?.from || "/";

  return (
    <Shell title="Entrar" sub="Aceda com a sua conta de equipa.">
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (v) => {
          setServerError(null);
          try {
            await login(v.email, v.password);
            navigate(from, { replace: true });
          } catch (e) {
            setServerError((e as Error).message);
          }
        })}
      >
        {serverError && <Alert variant="destructive">{serverError}</Alert>}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.pt"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">E-mail inválido.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Palavra-passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">Palavra-passe em falta.</p>}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Entrar
        </Button>
        <div className="flex items-center justify-between text-sm">
          <button
            className="cursor-pointer text-info hover:underline"
            onClick={() => {
              setForgotOpen(true);
              setForgotMsg(null);
            }}
          >
            Esqueci-me da password
          </button>
          <Link className="text-info hover:underline" to="/register">
            Criar conta
          </Link>
        </div>
        <Dialog
          open={forgotOpen}
          onClose={() => setForgotOpen(false)}
          title="🔑 Recuperar password"
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Indique o seu email; enviaremos um link de recuperação.
            </p>
            {forgotMsg && <Alert variant={forgotLink ? "warning" : "success"}>{forgotMsg}</Alert>}
            {forgotLink && (
              <a
                href={forgotLink}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              >
                Abrir link de reset diretamente (dev)
              </a>
            )}
            <Input
              type="email"
              placeholder="o-seu@email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <Button
              className="w-full"
              loading={forgotBusy}
              disabled={!forgotEmail}
              onClick={async () => {
                setForgotBusy(true);
                try {
                  const r = await apiFetch<{
                    message: string;
                    emailSent?: boolean;
                    devLink?: string;
                  }>("/api/auth/forgot-password", {
                    method: "POST",
                    body: { email: forgotEmail },
                    noRetry: true,
                  });
                  setForgotMsg(
                    r.emailSent === false
                      ? "Não conseguimos enviar o email agora. Contacte o formador/admin (ele pode gerar um link em Admin) ou tente mais tarde."
                      : r.message,
                  );
                  setForgotLink(r.devLink ?? null);
                } catch (e) {
                  setForgotMsg((e as Error).message);
                } finally {
                  setForgotBusy(false);
                }
              }}
            >
              Enviar link
            </Button>
          </div>
        </Dialog>
      </form>
    </Shell>
  );
}

export function RegisterPage() {
  const registerUser = useSession((s) => s.register);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinCode = searchParams.get("join");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const pwWatch = watch("password");

  return (
    <Shell
      title="Criar conta"
      sub="Depois de criar, junte-se à equipa do seu formador com o código de convite."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (v) => {
          setServerError(null);
          try {
            await registerUser(v.name, v.email, v.password);
            navigate(joinCode ? `/entrar/${joinCode}` : "/", { replace: true });
          } catch (e) {
            setServerError((e as Error).message);
          }
        })}
      >
        {serverError && <Alert variant="destructive">{serverError}</Alert>}
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" autoComplete="name" placeholder="O seu nome" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">Mínimo 2 caracteres.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email2">E-mail</Label>
          <Input id="email2" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">E-mail inválido.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password2">Palavra-passe</Label>
          <Input
            id="password2"
            type="password"
            autoComplete="new-password"
            {...register("password", {
              validate: (v) =>
                passwordStrength(v).score >= 2 ||
                "Password demasiado fraca — mistura maiúsculas, minúsculas, números e símbolos.",
            })}
          />
          <StrengthMeter pw={pwWatch} />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message || "Mínimo 8 caracteres."}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Criar conta
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link className="text-info hover:underline" to="/login">
            Entrar
          </Link>
        </p>
      </form>
    </Shell>
  );
}
