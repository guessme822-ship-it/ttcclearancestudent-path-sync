import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — TCC Student Clearance" },
      { name: "description", content: "Choose a new password for your TCC clearance account." },
      { property: "og:title", content: "Set a new password — TCC Student Clearance" },
      { property: "og:description", content: "Choose a new password for your TCC clearance account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") setReady(true); });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session && isRecovery) setReady(true); else if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="glass w-full max-w-md rounded-3xl border p-6 shadow-lift sm:p-8">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">Open this page from the reset link in your email. <Link to="/forgot-password" className="text-primary underline">Request a new link</Link>.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="pw2">Confirm password</Label><Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password</Button>
          </form>
        )}
      </div>
    </div>
  );
}
