import { Suspense, lazy } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, RequireAuth } from "./components/layout/AppLayout.tsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.tsx";
import { JourneyPage } from "./pages/JourneyPage.tsx";
import { MissionsPage } from "./pages/MissionsPage.tsx";
import { ProgressPage } from "./pages/ProgressPage.tsx";
import { MissionDetailPage } from "./pages/MissionDetailPage.tsx";
import { useSession } from "./stores/session.ts";
import { JoinPage } from "./features/team/JoinPage.tsx";
import { Spinner } from "./components/ui/misc.tsx";

// code-splitting: páginas pesadas (conteúdo embutido) carregam sob demanda
const LearnPage = lazy(() =>
  import("./pages/LearnPage.tsx").then((m) => ({ default: m.LearnPage })),
);
const PracticePage = lazy(() =>
  import("./pages/PracticePage.tsx").then((m) => ({ default: m.PracticePage })),
);
const TeamPage = lazy(() => import("./pages/TeamPage.tsx").then((m) => ({ default: m.TeamPage })));
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage.tsx").then((m) => ({ default: m.SettingsPage })),
);

const page = (el: React.ReactNode) => (
  <Suspense
    fallback={
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    }
  >
    {el}
  </Suspense>
);

function GuestOnly({ children }: { children: React.ReactNode }) {
  const status = useSession((s) => s.status);
  if (status === "authed") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-xl font-bold">Página não encontrada</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        <Link className="text-info underline" to="/">
          Voltar à jornada
        </Link>
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route path="/entrar/:code" element={<JoinPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<JourneyPage />} />
          <Route path="missoes" element={<MissionsPage />} />
          <Route path="missoes/:id" element={<MissionDetailPage />} />
          <Route path="aprender" element={page(<LearnPage />)} />
          <Route path="praticar" element={page(<PracticePage />)} />
          <Route path="progresso" element={page(<ProgressPage />)} />
          <Route path="equipa" element={page(<TeamPage />)} />
          <Route path="definicoes" element={page(<SettingsPage />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
