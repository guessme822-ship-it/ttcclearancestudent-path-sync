import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Award, CalendarCheck, History, Printer, RotateCcw, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressRing, StatusBadge, statusIcon } from "@/components/status";
import { Card } from "@/components/states";
import { progressOf, type RequestDetail, type Item } from "@/lib/clearance";
import { errMsg } from "@/lib/session";
import { cn } from "@/lib/utils";

const fmt = (d: string | null) => (d ? format(new Date(d), "MMM d, yyyy · h:mm a") : "—");

const BORDER: Record<string, string> = {
  approved: "border-l-success", pending: "border-l-warning", rejected: "border-l-danger", not_started: "border-l-neutral",
};

export function RequestSummary({ r }: { r: RequestDetail }) {
  const p = progressOf(r.items);
  const done = r.status === "completed";
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border p-5 shadow-soft sm:p-6", done ? "bg-success-gradient text-primary-foreground" : "bg-card")}>
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        {done ? (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-card/20"><Award className="h-14 w-14" /></div>
        ) : (
          <ProgressRing value={p.pct} label="complete" />
        )}
        <div className="flex-1 text-center sm:text-left">
          <p className={cn("text-xs font-medium uppercase tracking-wider", done ? "opacity-90" : "text-muted-foreground")}>{r.reference_no} · {r.semester} {r.school_year}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{done ? "CLEARANCE COMPLETED" : r.status === "rejected" ? "Action required" : r.status === "cancelled" ? "Request cancelled" : "Clearance in progress"}</h2>
          <p className={cn("mt-1 text-sm", done ? "opacity-90" : "text-muted-foreground")}>
            {done ? `All required offices have approved your clearance on ${fmt(r.completed_at)}.` : `${p.approved} / ${p.total} offices approved · ${p.pct}% complete`}
          </p>
          {!done && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">{p.approved} approved</span>
              <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">{p.pending} pending</span>
              <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">{p.rejected} rejected</span>
            </div>
          )}
        </div>
        {done && (
          <Button asChild variant="secondary" className="no-print">
            <Link to="/student/certificate/$id" params={{ id: r.id }}><Printer className="mr-1 h-4 w-4" /> Print confirmation</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function OfficeCards({ r, mode, highlightOffice }: { r: RequestDetail; mode: "student" | "staff" | "admin"; highlightOffice?: string | null }) {
  const [resubmit, setResubmit] = useState<Item | null>(null);
  return (
    <>
      <ol className="grid gap-3 md:grid-cols-2">
        {r.items.map((it, idx) => {
          const S = statusIcon(it.status);
          return (
            <li key={it.id} className={cn("animate-rise rounded-2xl border border-l-4 bg-card p-4 shadow-soft", BORDER[it.status], highlightOffice === it.office_id && "ring-2 ring-primary/40")} style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", S.cls)}><S.Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-xs text-muted-foreground">Step {idx + 1}</p>
                    <h3 className="font-semibold">{it.offices?.name}</h3>
                  </div>
                </div>
                <StatusBadge status={it.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Assigned approver</dt><dd className="text-right">{(r.approvers[it.office_id] ?? []).join(", ") || "Unassigned"}</dd>
                <dt className="text-muted-foreground">Reviewed by</dt><dd className="text-right">{it.reviewer ? `${it.reviewer.first_name} ${it.reviewer.last_name}` : "—"}</dd>
                <dt className="text-muted-foreground">Date reviewed</dt><dd className="text-right">{fmt(it.reviewed_at)}</dd>
                <dt className="text-muted-foreground">Last updated</dt><dd className="text-right">{fmt(it.updated_at)}</dd>
              </dl>
              {it.remarks && it.status !== "rejected" && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs"><b>Remarks:</b> {it.remarks}</p>}
              {it.status === "rejected" && (
                <div className="mt-3 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-semibold text-danger"><AlertTriangle className="h-4 w-4" /> Reason for rejection</p>
                  <p className="mt-1 text-foreground">{it.remarks}</p>
                  {mode === "student" && (
                    <>
                      <p className="mt-2 text-xs text-muted-foreground"><b>Action required:</b> settle the concern with the {it.offices?.name}, then resubmit for review.</p>
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => setResubmit(it)}><RotateCcw className="mr-1 h-4 w-4" /> Resubmit to {it.offices?.name}</Button>
                    </>
                  )}
                </div>
              )}
              {it.status === "pending" && mode === "student" && <p className="mt-3 text-xs text-muted-foreground">Waiting for {it.offices?.name} review. No action needed yet.</p>}
            </li>
          );
        })}
      </ol>
      {resubmit && <ResubmitDialog item={resubmit} requestId={r.id} onClose={() => setResubmit(null)} />}
    </>
  );
}

function ResubmitDialog({ item, requestId, onClose }: { item: Item; requestId: string; onClose: () => void }) {
  const [note, setNote] = useState("");
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("resubmit_clearance_item", { _item: item.id, _note: note.trim().slice(0, 500) || undefined });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Resubmitted to ${item.offices?.name}`);
      qc.invalidateQueries({ queryKey: ["request", requestId] });
      qc.invalidateQueries({ queryKey: ["my-requests"] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resubmit to {item.offices?.name}</DialogTitle>
          <DialogDescription>Let the office know how you addressed: “{item.remarks}”</DialogDescription>
        </DialogHeader>
        <Textarea placeholder="e.g. Paid the balance, OR #123456" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>Resubmit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ActivityTimeline({ logs }: { logs: RequestDetail["logs"] }) {
  return (
    <Card title="Approval history" action={<History className="h-4 w-4 text-muted-foreground" />}>
      {logs.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
        <ol className="relative space-y-4 border-l pl-5">
          {logs.map((l) => (
            <li key={l.id} className="relative">
              <span className={cn("absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card", l.new_status === "approved" || l.new_status === "completed" ? "bg-success" : l.new_status === "rejected" ? "bg-danger" : "bg-primary")} />
              <p className="text-sm font-medium">{l.action}</p>
              <p className="text-xs text-muted-foreground">
                {l.actor ? `${l.actor.first_name} ${l.actor.last_name} · ` : ""}{fmt(l.created_at)}
                {l.previous_status && l.new_status && ` · ${l.previous_status} → ${l.new_status}`}
              </p>
              {l.details && <p className="mt-0.5 text-xs text-muted-foreground">“{l.details}”</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function StudentInfoCard({ r }: { r: RequestDetail }) {
  return (
    <Card title="Student information" action={<UserCheck className="h-4 w-4 text-muted-foreground" />}>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Name</dt><dd className="font-medium">{r.profile ? `${r.profile.last_name}, ${r.profile.first_name} ${r.profile.middle_name ?? ""}` : "—"}</dd>
        <dt className="text-muted-foreground">Student ID</dt><dd className="font-mono">{r.student?.student_number}</dd>
        <dt className="text-muted-foreground">Program</dt><dd>{r.student?.program}</dd>
        <dt className="text-muted-foreground">Year / Section</dt><dd>{r.student?.year_level} – {r.student?.section ?? "—"}</dd>
        <dt className="text-muted-foreground">Email</dt><dd className="truncate">{r.profile?.email}</dd>
        <dt className="text-muted-foreground">Contact</dt><dd>{r.profile?.contact_number ?? "—"}</dd>
      </dl>
      <div className="mt-4 border-t pt-3 text-sm">
        <p className="flex items-center gap-1.5 font-medium"><CalendarCheck className="h-4 w-4 text-primary" /> Request</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          <dt className="text-muted-foreground">Reference</dt><dd className="font-mono">{r.reference_no}</dd>
          <dt className="text-muted-foreground">Term</dt><dd>{r.semester} {r.school_year}</dd>
          <dt className="text-muted-foreground">Requested</dt><dd>{fmt(r.created_at)}</dd>
          <dt className="text-muted-foreground">Overall</dt><dd><StatusBadge status={r.status} /></dd>
        </dl>
      </div>
    </Card>
  );
}
