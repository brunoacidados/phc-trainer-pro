import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session.ts";
import { useProgress } from "../../stores/progress.ts";
import { AppFooter, AppHeader } from "./AppHeader.tsx";
import { BottomNav } from "./BottomNav.tsx";
import { Alert } from "../ui/alert.tsx";
import { Button } from "../ui/button.tsx";
import { apiFetch } from "../../lib/api.ts";
import { toast } from "../ui/toast.tsx";
import { Spinner } from "../ui/misc.tsx";
import { Toaster } from "../ui/toast.tsx";
import { Mascot } from "../mascot/Mascot.tsx";
import { ChatDrawer } from "../../features/chat/ChatDrawer.tsx";
import { FocusModal } from "../../features/focus/FocusModal.tsx";
import { LessonDrawer } from "../../features/lesson/LessonDrawer.tsx";
import { OnboardModal, useOnboard } from "../../features/onboard/OnboardModal.tsx";
import { CommandPalette } from "../../features/search/CommandPalette.tsx";
import { useUi } from "../../stores/ui.ts";
import { initNetworkListeners, useSync } from "../../stores/sync.ts";

/** bootstrap de sessão + guarda de rotas autenticadas */
export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const status = useSession((s) => s.status);
  const bootstrap = useSession((s) => s.bootstrap);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (status === "loading") void bootstrap();
  }, [status, bootstrap]);

  useEffect(() => {
    if (status === "anon")
      navigate("/login", { state: { from: location.pathname }, replace: true });
  }, [status, navigate, location.pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">A preparar o Professor Einstein…</p>
      </div>
    );
  }
  if (status === "anon") return null;
  return <>{children ?? <Outlet />}</>;
}

/** abre o wizard de onboarding na 1ª sessão (state.onboarded=false) */
function OnboardGate() {
  const state = useProgress((s) => s.state);
  const status = useProgress((s) => s.status);
  const openWizard = useOnboard((s) => s.openWizard);
  const asked = useRef(false);
  useEffect(() => {
    if (status === "ready" && state && !state.onboarded && !asked.current) {
      asked.current = true;
      const t = setTimeout(openWizard, 600);
      return () => clearTimeout(t);
    }
  }, [status, state, openWizard]);
  return null;
}

function EmailVerifyBanner() {
  const user = useSession((s) => s.user);
  if (!user || user.emailVerified) return null;
  return (
    <Alert variant="warning" className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <span>✉️ Confirme o seu email ({user.email}) para ativar todas as funcionalidades.</span>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            const r = await apiFetch<{ message: string }>("/api/auth/resend-verification", {
              method: "POST",
            });
            toast.success(r.message);
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      >
        Reenviar email
      </Button>
    </Alert>
  );
}

export function AppLayout() {
  useEffect(() => initNetworkListeners(), []);
  const refreshSync = useSync((s) => s.refresh);
  useEffect(() => {
    refreshSync();
  }, [refreshSync]);
  const paletteOpen = useUi((s) => s.paletteOpen);
  const setPalette = useUi((s) => s.setPalette);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(!useUi.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPalette]);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main" className="skip-link">
        Saltar para o conteúdo
      </a>
      <AppHeader />
      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 pb-20 sm:px-4 sm:py-6 md:pb-6"
      >
        <EmailVerifyBanner />
        <Outlet />
      </main>
      <AppFooter />
      <BottomNav />
      <Mascot />
      <ChatDrawer />
      <FocusModal />
      <LessonDrawer />
      <OnboardModal />
      <OnboardGate />
      <CommandPalette open={paletteOpen} onClose={() => setPalette(false)} />
      <Toaster />
    </div>
  );
}
