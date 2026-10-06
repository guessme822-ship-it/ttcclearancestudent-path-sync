import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, ClipboardCheck, Clock3, FileCheck2, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Clearance System — Torres Capitol College, Inc." },
      { name: "description", content: "Request, track and complete your student clearance online at Torres Capitol College, Maramag, Bukidnon." },
      { property: "og:title", content: "Student Clearance System — Torres Capitol College, Inc." },
      { property: "og:description", content: "Request, track and complete your student clearance online." },
    ],
  }),
  component: Landing,
});

const OFFICES = [["Registrar", "approved"], ["Cashier", "pending"], ["Library", "approved"], ["Guidance Office", "pending"], ["Department Office", "approved"]] as const;

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
            <div className="leading-tight"><p className="font-display text-sm font-bold">Torres Capitol College</p><p className="text-[11px] text-muted-foreground">Student Clearance</p></div>
          </div>
          <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4">
        <section className="grid gap-10 py-14 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-accent-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Official clearance portal</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl">Your clearance,<br />cleared <span className="text-primary">in one place.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">Submit one request, watch every office sign off in real time, and download your clearance confirmation the moment you're done.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-xl px-6"><Link to="/auth" search={{ tab: "register" }}>Register as student <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6"><Link to="/auth">Sign in</Link></Button>
            </div>
          </div>
          <div className="glass animate-rise rounded-3xl border p-5 shadow-lift [animation-delay:120ms] sm:p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">TCC-2026-A1B2C3</p><p className="font-display font-bold">1st Semester · 2026–2027</p></div>
              <div className="text-right"><p className="font-display text-3xl font-extrabold text-primary">60%</p><p className="text-xs text-muted-foreground">3 / 5 approved</p></div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-3/5 rounded-full bg-brand" /></div>
            <ul className="mt-5 space-y-2">
              {OFFICES.map(([o, s]) => (
                <li key={o} className="flex items-center justify-between rounded-xl border bg-card px-3 py-2.5">
                  <span className="text-sm font-medium">{o}</span>
                  <span className={s === "approved" ? "rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success" : "rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning"}>{s === "approved" ? "Approved" : "Pending"}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ClipboardCheck, "One request", "Every required office receives your request automatically."],
            [Clock3, "Live tracking", "See who reviewed, when, and any remarks."],
            [Bell, "Instant updates", "Get notified the moment an office approves or needs action."],
            [FileCheck2, "Printable proof", "Download your confirmation once fully cleared."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Bell;
            return (
              <div key={t as string} className="rounded-2xl border bg-card p-5 shadow-soft">
                <I className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{t as string}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
              </div>
            );
          })}
        </section>
      </main>
      <footer className="border-t bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© 2026 Torres Capitol College, Inc.</p>
          <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Purok-2B, Sayre Highway, Pandalatan, Maramag, Bukidnon 8714</p>
        </div>
      </footer>
    </div>
  );
}
