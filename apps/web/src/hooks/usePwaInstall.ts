import { useEffect, useState } from "react";

interface BIPEvent extends Event { prompt: () => Promise<void> }

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onBip = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const promptInstall = async () => { if (deferred) { await deferred.prompt(); setDeferred(null); } };
  return { canInstall: !!deferred, installed, promptInstall };
}
