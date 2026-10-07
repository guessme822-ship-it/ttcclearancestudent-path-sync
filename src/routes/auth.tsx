import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchMe, homeFor, PROGRAMS } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ inactive: s.inactive ? 1 : undefined, tab: s.tab === "register" ? "register" : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — TCC Student Clearance" },
      { name: "description", content: "Sign in or register for the Torres Capitol College student clearance system." },
      { property: "og:title", content: "Sign in — TCC Student Clearance" },
      { property: "og:description", content: "Sign in or register for the Torres Capitol College student clearance system." },
    ],
  }),
  component: AuthPage,
});

const DEMO = [
  ["Administrator", "admin@demo.tcc.edu.ph"],
  ["Registrar staff", "registrar@demo.tcc.edu.ph"],
  ["Cashier staff", "cashier@demo.tcc.edu.ph"],
  ["Student (rejected item)", "juan@demo.tcc.edu.ph"],
  ["Student (completed)", "mark@demo.tcc.edu.ph"],
  ["Student (no request yet)", "kim@demo.tcc.edu.ph"],
];

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });
const regSchema = z.object({
  student_number: z.string().trim().regex(/^\d{4}-\d{5}$/, "Use the format 2024-00123"),
  first_name: z.string().trim().min(1, "Required").max(80),
  middle_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  contact_number: z.string().trim().regex(/^(09|\+639)\d{9}$/, "Use 09XXXXXXXXX"),
  program: z.string().min(1, "Choose a program"),
  year_level: z.coerce.number().min(1).max(6),
  section: z.string().trim().max(20).optional(),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registered, setRegistered] = useState<string | null>(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ student_number: "", first_name: "", middle_name: "", last_name: "", email: "", contact_number: "", program: "", year_level: "1", section: "", password: "" });

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    const p = loginSchema.safeParse(login);
    if (!p.success) return setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])));
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(p.data);
    if (error) { setBusy(false); return toast.error(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message); }
    const me = await fetchMe();
    qc.setQueryData(["me"], me);
    setBusy(false);
    if (!me) return toast.error("Your account profile could not be loaded.");
    if (!me.profile.is_active) { await supabase.auth.signOut(); return toast.error("Your account is deactivated. Please contact the administrator."); }
    toast.success(`Welcome back, ${me.profile.first_name || "there"}!`);
    navigate({ to: homeFor(me.role) });
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    const p = regSchema.safeParse(reg);
    if (!p.success) return setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])));
    setErrors({});
    setBusy(true);
    const { password, email, ...meta } = p.data;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth", data: { ...meta, role: "student" } } });
    setBusy(false);
    if (error) return toast.error(error.message.includes("students_student_number") ? "That Student ID is already registered." : error.message);
    if (data.session) { navigate({ to: "/student" }); return; }
    setRegistered(email);
  }

  const r = (k: keyof typeof reg) => ({ id: k, value: reg[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setReg({ ...reg, [k]: e.target.value }) });

  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <Link to="/" className="mb-8 inline-flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-11 w-11 rounded-xl" />
            <div><p className="font-display font-bold">Torres Capitol College, Inc.</p><p className="text-xs text-muted-foreground">Student Clearance System</p></div>
          </Link>
          <h1 className="text-4xl font-extrabold leading-tight">Clearance without the<br /><span className="text-primary">office-to-office walk.</span></h1>
          <p className="mt-4 max-w-md text-muted-foreground">Request once, track every office in real time, and download your confirmation when you're fully cleared.</p>
          <div className="mt-8 rounded-2xl border bg-card/80 p-4 shadow-soft">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Demo accounts <span className="rounded bg-warning-soft px-1.5 text-[10px] font-bold uppercase text-warning">Demo data</span></p>
            <p className="mb-2 text-xs text-muted-foreground">Password for all: <code className="rounded bg-muted px-1">Demo@2026</code> — click to fill.</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO.map(([l, e]) => (
                <button key={e} type="button" onClick={() => setLogin({ email: e, password: "Demo@2026" })} className="rounded-lg border bg-background px-2 py-1.5 text-left text-xs transition hover:border-primary hover:bg-accent">
                  <span className="block font-medium">{l}</span><span className="text-muted-foreground">{e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass mx-auto w-full max-w-lg rounded-3xl border p-5 shadow-lift sm:p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src="/icon.svg" alt="" className="h-10 w-10 rounded-xl" />
            <div><p className="font-display text-sm font-bold">Torres Capitol College, Inc.</p><p className="text-xs text-muted-foreground">Student Clearance System</p></div>
          </div>
          {search.inactive && <p className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">Your account is deactivated. Please contact the administrator.</p>}
          {registered ? (
            <div className="py-6 text-center">
              <MailCheck className="mx-auto mb-3 h-12 w-12 text-success" />
              <h2 className="text-xl font-bold">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <b>{registered}</b>. Confirm your email, then sign in.</p>
              <Button className="mt-6" variant="outline" onClick={() => setRegistered(null)}>Back to sign in</Button>
            </div>
          ) : (
            <Tabs defaultValue={search.tab ?? "login"} onValueChange={() => setErrors({})}>
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Student registration</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={doLogin} className="space-y-4" noValidate>
                  <Field error={errors["email"]} id="email" label="Email"><Input id="email" type="email" autoComplete="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></Field>
                  <Field error={errors["password"]} id="password" label="Password"><Input id="password" type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></Field>
                  <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>
                  <Button type="submit" className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
                </form>
                <div className="mt-6 lg:hidden">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">DEMO ACCOUNTS · password Demo@2026</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEMO.map(([l, e]) => (
                      <button key={e} type="button" onClick={() => setLogin({ email: e, password: "Demo@2026" })} className="rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent">{l}</button>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={doRegister} className="grid grid-cols-1 gap-3 sm:grid-cols-2" noValidate>
                  <Field error={errors["student_number"]} id="student_number" label="Student ID"><Input placeholder="2024-00123" {...r("student_number")} /></Field>
                  <Field error={errors["contact_number"]} id="contact_number" label="Contact number"><Input placeholder="09XXXXXXXXX" inputMode="tel" {...r("contact_number")} /></Field>
                  <Field error={errors["first_name"]} id="first_name" label="First name"><Input {...r("first_name")} /></Field>
                  <Field error={errors["last_name"]} id="last_name" label="Last name"><Input {...r("last_name")} /></Field>
                  <Field error={errors["middle_name"]} id="middle_name" label="Middle name (optional)"><Input {...r("middle_name")} /></Field>
                  <Field error={errors["section"]} id="section" label="Section (optional)"><Input placeholder="A" {...r("section")} /></Field>
                  <Field error={errors["program"]} id="program" label="Program">
                    <Select value={reg.program} onValueChange={(v) => setReg({ ...reg, program: v })}>
                      <SelectTrigger id="program"><SelectValue placeholder="Choose program" /></SelectTrigger>
                      <SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field error={errors["year_level"]} id="year_level" label="Year level">
                    <Select value={reg.year_level} onValueChange={(v) => setReg({ ...reg, year_level: v })}>
                      <SelectTrigger id="year_level"><SelectValue /></SelectTrigger>
                      <SelectContent>{[1, 2, 3, 4, 5].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2"><Field error={errors["email"]} id="email" label="Email"><Input type="email" autoComplete="email" {...r("email")} /></Field></div>
                  <div className="sm:col-span-2"><Field error={errors["password"]} id="password" label="Password"><Input type="password" autoComplete="new-password" {...r("password")} /></Field></div>
                  <Button type="submit" className="h-11 sm:col-span-2" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create student account</Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}


function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
