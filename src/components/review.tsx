import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { StatusBadge } from "@/components/status";
import { ActivityTimeline, OfficeCards, RequestSummary, StudentInfoCard } from "@/components/tracker";
import { requestDetailQuery, type Item } from "@/lib/clearance";
import { errMsg, type Me } from "@/lib/session";

export function ReviewPage({ id, me }: { id: string; me: Me }) {
  const q = useQuery(requestDetailQuery(id));
  if (q.isLoading) return <ListSkeleton rows={5} />;
  if (q.isError || !q.data) return <ErrorState message="Unable to load this clearance request." onRetry={() => q.refetch()} />;
  const r = q.data;
  const actionable = r.items.filter((i) => i.status === "pending" && (me.role === "admin" || i.office_id === me.officeId));
  const mine = r.items.find((i) => i.office_id === me.officeId);
  return (
    <div className="space-y-6">
      <PageHeader title={`Review · ${r.reference_no}`} description={`${r.profile?.first_name} ${r.profile?.last_name} · ${r.student?.program}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {me.role === "staff" && mine && (
            <Card title={`${me.officeName} decision`} action={<StatusBadge status={mine.status} />}>
              {mine.status === "pending" ? <DecisionButtons item={mine} requestId={r.id} cancelled={r.status === "cancelled"} /> : (
                <p className="text-sm text-muted-foreground">Your office already {mine.status} this request{mine.remarks ? `: “${mine.remarks}”` : "."} If the student resubmits, it will return to pending.</p>
              )}
            </Card>
          )}
          {me.role === "admin" && actionable.length > 0 && (
            <Card title="Pending office decisions (admin override)">
              <div className="space-y-3">{actionable.map((i) => (
                <div key={i.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center"><span className="flex-1 font-medium">{i.offices?.name}</span><DecisionButtons item={i} requestId={r.id} cancelled={r.status === "cancelled"} /></div>
              ))}</div>
            </Card>
          )}
          <RequestSummary r={r} />
          <OfficeCards r={r} mode={me.role === "admin" ? "admin" : "staff"} highlightOffice={me.officeId} />
        </div>
        <div className="space-y-6">
          <StudentInfoCard r={r} />
          <ActivityTimeline logs={r.logs} />
        </div>
      </div>
    </div>
  );
}

function DecisionButtons({ item, requestId, cancelled }: { item: Item; requestId: string; cancelled: boolean }) {
  const qc = useQueryClient();
  const [approve, setApprove] = useState(false);
  const [reject, setReject] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");
  const m = useMutation({
    mutationFn: async (v: { d: "approved" | "rejected"; r: string }) => {
      const { error } = await supabase.rpc("review_clearance_item", { _item: item.id, _decision: v.d, _remarks: v.r.trim().slice(0, 1000) || undefined });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v.d === "approved" ? "Clearance approved. The student has been notified." : "Clearance rejected. The student has been notified.");
      setApprove(false); setReject(false); setReason(""); setRemarks("");
      qc.invalidateQueries({ queryKey: ["request", requestId] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  if (cancelled) return <p className="text-sm text-muted-foreground">This request was cancelled by the student.</p>;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => setApprove(true)}><CheckCircle2 className="mr-1 h-4 w-4" /> Approve</Button>
        <Button variant="destructive" onClick={() => setReject(true)}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
      </div>
      <AlertDialog open={approve} onOpenChange={setApprove}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Approve {item.offices?.name} clearance?</AlertDialogTitle>
            <AlertDialogDescription>Your name and the current date/time will be recorded, and the student will be notified.</AlertDialogDescription></AlertDialogHeader>
          <div className="space-y-1.5"><Label htmlFor="rem">Remarks (optional)</Label><Textarea id="rem" value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={1000} /></div>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); m.mutate({ d: "approved", r: remarks }); }} disabled={m.isPending}>{m.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Confirm approval</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={reject} onOpenChange={setReject}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {item.offices?.name} clearance</DialogTitle>
            <DialogDescription>Tell the student exactly what is missing and what they need to do. This reason is required.</DialogDescription></DialogHeader>
          <div className="space-y-1.5"><Label htmlFor="reason">Reason for rejection *</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="e.g. Unreturned book: Introduction to Programming (due Sept 12). Return it to the Library." />
            {reason.trim().length > 0 && reason.trim().length < 5 && <p className="text-xs text-danger">Please write at least 5 characters.</p>}</div>
          <DialogFooter><Button variant="outline" onClick={() => setReject(false)}>Cancel</Button>
            <Button variant="destructive" disabled={reason.trim().length < 5 || m.isPending} onClick={() => m.mutate({ d: "rejected", r: reason })}>{m.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Reject clearance</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
