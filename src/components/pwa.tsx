import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-warning px-3 py-2 text-center text-sm font-medium text-primary-foreground">
      <WifiOff className="h-4 w-4" /> You're offline. Requests, approvals and data updates need an internet connection.
    </div>
  );
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("tcc-install-dismissed")) setHidden(true);
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (!evt || hidden) return null;
  return (
    <div className="glass fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border p-3 shadow-lift lg:bottom-4">
      <img src="/icon.svg" alt="" className="h-10 w-10 rounded-xl" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">Install TCC Clearance</p>
        <p className="text-muted-foreground">Open it from your home screen like an app.</p>
      </div>
      <Button size="sm" onClick={async () => { await evt.prompt(); setEvt(null); }}>
        <Download className="mr-1 h-4 w-4" /> Install
      </Button>
      <button aria-label="Dismiss" className="rounded-lg p-1 text-muted-foreground hover:bg-muted" onClick={() => { localStorage.setItem("tcc-install-dismissed", "1"); setHidden(true); }}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
