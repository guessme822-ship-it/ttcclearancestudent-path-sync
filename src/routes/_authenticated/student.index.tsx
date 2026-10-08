import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, ListSkeleton, StatCard } from "@/components/states";
import { ProgressRing, StatusBadge } from "@/components/status";
import { useNotifications } from "@/components/notifications";
import { supabase } from "@/integrations/supabase/client";
import { myRequestsQuery, progressOf, yearLabel } from "@/lib/clearance";
import { fullName, meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/student/")({ component: Dash });

function Dash() {
  const me = useSuspenseQuery(meQuery).data as Me;
  const reqs = useQuery(myRequestsQuery(me.id));
  const notifs = useNotifications(me.id, 5);
  const logs = useQuery({
    queryKey: ["my-activity", me.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_logs").select("id, action, created_at, new_status").order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });
  const current = reqs.data?.find((r) => r.status !== "cancelled");
  const p = progressOf(current?.clearance_items ?? []);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-hero bg-card p-5 shadow-soft sm:p-6">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{fullName(me.profile)}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-card px-3 py-1 font-mono font-semibold shadow-soft">{me.student?.student_number ?? "No Student ID"}</span>
          <span className="rounded-full bg-card px-3 py-1 shadow-soft">{me.student?.program}</span>
          <span className="rounded-full bg-card px-3 py-1 shadow-soft">{me.student ? yearLabel(me.student.year_level) : ""} {me.student?.section && `· Sec ${me.student.section}`}</span>
        </div>
      </div>

      {reqs.isLoading ? <ListSkeleton rows={2} /> : reqs.isError ? <ErrorState message="Unable to load clearance data. Please try again." onRetry={() => reqs.refetch()} /> : !current ? (
        <EmptyState title="No clearance requests yet." description="Start your clearance request and every required office will be notified automatically."
          action={<Button asChild><Link to="/student/clearance">Request clearance <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Overall status" value={<StatusBadge status={current.status} className="text-sm" />} icon={<ListChecks className="h-5 w-5" />} />
            <StatCard label="Approved" value={p.approved} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" hint={`of ${p.total} offices`} />
            <StatCard label="Pending" value={p.pending} icon={<Clock className="h-5 w-5" />} tone="warning" />
            <StatCard label="Rejected" value={p.rejected} icon={<XCircle className="h-5 w-5" />} tone="danger" />
          </div>
          <Card title="Current clearance request">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <ProgressRing value={p.pct} label={`${p.approved}/${p.total}`} />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-mono text-sm">{current.reference_no}</p>
                <p className="text-sm text-muted-foreground">{current.semester} {current.school_year} · requested {formatDistanceToNow(new Date(current.created_at), { addSuffix: true })}</p>
                {current.status === "rejected" && <p className="mt-2 text-sm font-medium text-danger">An office needs action from you. Open the status page to see why.</p>}
              </div>
              <Button asChild><Link to="/student/status">View status <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
          </Card>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Notifications" action={<Link to="/student/notifications" className="text-xs font-medium text-primary">View all</Link>}>
          {notifs.isLoading ? <ListSkeleton rows={3} /> : (notifs.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No notifications.</p> : (
            <ul className="space-y-3">{notifs.data!.map((n) => (
              <li key={n.id} className="flex gap-2 text-sm"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? "bg-muted" : "bg-primary"}`} />
                <div><p className={n.is_read ? "" : "font-semibold"}>{n.title}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p></div></li>
            ))}</ul>
          )}
        </Card>
        <Card title="Recent activity">
          {logs.isLoading ? <ListSkeleton rows={3} /> : (logs.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
            <ul className="space-y-3">{logs.data!.map((l) => (
              <li key={l.id} className="text-sm"><p>{l.action}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p></li>
            ))}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
