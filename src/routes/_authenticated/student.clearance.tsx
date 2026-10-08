import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { Check, ChevronRight, ClipboardCheck, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { StatusBadge } from "@/components/status";
import { myRequestsQuery, settingsQuery, yearLabel } from "@/lib/clearance";
import { errMsg, fullName, meQuery, type Me } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/clearance")({ component: MyClearance });

function MyClearance() {
  const me = useSuspenseQuery(meQuery).data as Me;
  const reqs = useQuery(myRequestsQuery(me.id));
  const active = reqs.data?.find((r) => r.status === "in_progress" || r.status === "rejected");
  return (
    <div className="space-y-6">
      <PageHeader title="My Clearance" description="Request a new clearance and view your clearance history." />
      {reqs.isLoading ? <ListSkeleton rows={2} /> : reqs.isError ? <ErrorState onRetry={() => reqs.refetch()} /> : active ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <div className="flex-1"><p className="font-semibold">You have an active request ({active.reference_no})</p><p className="text-sm text-muted-foreground">Track it on the status page. A new request can be made once this one is completed or cancelled.</p></div>
            <Button asChild><Link to="/student/status">Track progress</Link></Button>
          </div>
        </Card>
      ) : (
        <RequestWizard me={me} />
      )}
      <Card title="Clearance history">
        {reqs.isLoading ? <ListSkeleton rows={2} /> : (reqs.data ?? []).length === 0 ? <EmptyState title="No clearance requests yet." /> : (
          <div className="divide-y">
            {reqs.data!.map((r) => (
              <Link key={r.id} to="/student/history/$id" params={{ id: r.id }} className="flex flex-col gap-1 py-3 transition hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4 sm:px-2">
                <span className="font-mono text-sm font-semibold">{r.reference_no}</span>
                <span className="text-sm text-muted-foreground">{r.semester} {r.school_year}</span>
                <span className="text-xs text-muted-foreground">Requested {format(new Date(r.created_at), "MMM d, yyyy")}</span>
                <span className="text-xs text-muted-foreground">{r.completed_at ? `Completed ${format(new Date(r.completed_at), "MMM d, yyyy")}` : ""}</span>
                <span className="sm:ml-auto"><StatusBadge status={r.status} /></span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RequestWizard({ me }: { me: Me }) {
  const [step, setStep] = useState(0);
  const [agree, setAgree] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const settings = useQuery(settingsQuery);
  const offices = useQuery({
    queryKey: ["offices-active"],
    queryFn: async () => { const { data, error } = await supabase.from("offices").select("id,name,description").eq("is_active", true).order("sort_order"); if (error) throw error; return data; },
  });
  const submit = useMutation({
    mutationFn: async () => { const { data, error } = await supabase.rpc("submit_clearance"); if (error) throw error; return data; },
    onSuccess: () => {
      toast.success("Clearance request submitted!", { description: "All required offices have been notified." });
      qc.invalidateQueries();
      navigate({ to: "/student/status" });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const steps = ["Start", "Review info", "Confirm"];
  return (
    <Card>
      <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", i < step ? "bg-success text-primary-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
            <span className={cn("hidden text-sm sm:inline", i === step ? "font-semibold" : "text-muted-foreground")}>{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>
      {step === 0 && (
        <div>
          <h2 className="text-xl font-bold">Request clearance for {settings.data?.semester} {settings.data?.school_year}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your request goes to these offices in order:</p>
          {offices.isLoading ? <ListSkeleton rows={3} className="mt-4" /> : (offices.data ?? []).length === 0 ? <p className="mt-4 text-sm text-danger">No offices are configured yet. Please contact the administrator.</p> : (
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {offices.data!.map((o, i) => (
                <li key={o.id} className="rounded-xl border bg-muted/40 p-3"><p className="text-sm font-semibold">{i + 1}. {o.name}</p><p className="text-xs text-muted-foreground">{o.description}</p></li>
              ))}
            </ol>
          )}
          <Button className="mt-6" onClick={() => setStep(1)} disabled={!offices.data?.length}>Start request <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      )}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold">Review your information</h2>
          <p className="mt-1 text-sm text-muted-foreground">Make sure these details are correct. Update contact details on your Profile page.</p>
          {!me.student ? <p className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">Your student record is incomplete. Please contact the registrar.</p> : (
            <dl className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border p-4 text-sm sm:grid-cols-2">
              {[["Name", fullName(me.profile)], ["Student ID", me.student.student_number], ["Program", me.student.program], ["Year level", yearLabel(me.student.year_level)], ["Section", me.student.section ?? "—"], ["Email", me.email], ["Contact", me.profile.contact_number ?? "—"]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
          )}
          <div className="mt-6 flex gap-2"><Button variant="outline" onClick={() => setStep(0)}>Back</Button><Button onClick={() => setStep(2)} disabled={!me.student}>Looks correct <ChevronRight className="ml-1 h-4 w-4" /></Button></div>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold">Confirm and submit</h2>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
            <span>I confirm my information is accurate and I'm requesting clearance for {settings.data?.semester} {settings.data?.school_year}.</span>
          </label>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => submit.mutate()} disabled={!agree || submit.isPending}>{submit.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}Submit request</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
