import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { ActivityTimeline, OfficeCards, RequestSummary } from "@/components/tracker";
import { supabase } from "@/integrations/supabase/client";
import { myRequestsQuery, requestDetailQuery } from "@/lib/clearance";
import { errMsg, meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/student/status")({ component: Status });

function Status() {
  const me = useSuspenseQuery(meQuery).data as Me;
  const reqs = useQuery(myRequestsQuery(me.id));
  const current = reqs.data?.find((r) => r.status !== "cancelled");
  if (reqs.isLoading) return <ListSkeleton rows={4} />;
  if (reqs.isError) return <ErrorState message="Unable to load clearance data. Please try again." onRetry={() => reqs.refetch()} />;
  if (!current) return (
    <>
      <PageHeader title="Clearance Status" />
      <EmptyState title="No clearance requests yet." description="Once you submit a request, each office's progress will appear here." action={<Button asChild><Link to="/student/clearance">Request clearance</Link></Button>} />
    </>
  );
  return <RequestView id={current.id} title="Clearance Status" />;
}

export function RequestView({ id, title }: { id: string; title: string }) {
  const q = useQuery(requestDetailQuery(id));
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const cancel = useMutation({
    mutationFn: async () => { const { error } = await supabase.rpc("cancel_clearance", { _req: id }); if (error) throw error; },
    onSuccess: () => { toast.success("Request cancelled"); qc.invalidateQueries(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  if (q.isLoading) return <ListSkeleton rows={5} />;
  if (q.isError || !q.data) return <ErrorState message="Unable to load clearance data. Please try again." onRetry={() => q.refetch()} />;
  const r = q.data;
  const canCancel = r.status === "in_progress" || r.status === "rejected";
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Each office reviews your clearance separately." actions={canCancel && <Button variant="outline" onClick={() => setConfirm(true)}>Cancel request</Button>} />
      <RequestSummary r={r} />
      <OfficeCards r={r} mode="student" />
      <ActivityTimeline logs={r.logs} />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancel this clearance request?</AlertDialogTitle>
            <AlertDialogDescription>All office progress on {r.reference_no} will stop. You can submit a new request afterwards.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep request</AlertDialogCancel><AlertDialogAction onClick={() => cancel.mutate()} className="bg-destructive text-destructive-foreground">Cancel request</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
