import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — TCC Student Clearance" },
      { name: "description", content: "Reset your TCC clearance system password." },
      { property: "og:title", content: "Forgot password — TCC Student Clearance" },
      { property: "og:description", content: "Reset your TCC clearance system password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = z.string().trim().email().safeParse(email);
    if (!p.success) return toast.error("Enter a valid email address.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(p.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="glass w-full max-w-md rounded-3xl border p-6 shadow-lift sm:p-8">
        <Link to="/auth" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
        {sent ? (
          <div className="text-center">
            <MailCheck className="mx-auto mb-3 h-12 w-12 text-success" />
            <h1 className="text-xl font-bold">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">If an account exists for {email}, a reset link is on its way.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-2xl font-bold">Forgot your password?</h1>
            <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to set a new one.</p>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send reset link</Button>
          </form>
        )}
      </div>
    </div>
  );
}
