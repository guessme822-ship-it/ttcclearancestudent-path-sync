import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, DemoBadge, EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { StatusBadge } from "@/components/status";
import { OfficeCards, RequestSummary } from "@/components/tracker";
import { adminStudentsQuery } from "@/lib/admin-data";
import { requestDetailQuery } from "@/lib/clearance";

export const Route = createFileRoute("/_authenticated/admin/students/$id")({ component: P });

function P() {
  const { id } = Route.useParams();
  const st = useQuery(adminStudentsQuery);
  const reqs = useQuery({
    queryKey: ["admin", "student-reqs", id],
    queryFn: async () => { const { data, error } = await supabase.from("clearance_requests").select("*").eq("student_id", id).order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  const logs = useQuery({
    queryKey: ["admin", "student-logs", id],
    queryFn: async () => {
      const ids = (reqs.data ?? []).map((r) => r.id);
      let q = supabase.from("activity_logs").select("id, action, created_at, previous_status, new_status, details").order("created_at", { ascending: false }).limit(50);
      q = ids.length ? q.or(`actor_id.eq.${id},request_id.in.(${ids.join(",")})`) : q.eq("actor_id", id);
      const { data, error } = await q; if (error) throw error; return data;
    },
    enabled: reqs.isSuccess,
  });
  const current = reqs.data?.find((r) => r.status !== "cancelled");
  const detail = useQuery({ ...requestDetailQuery(current?.id ?? ""), enabled: !!current });
  if (st.isLoading) return <ListSkeleton />;
  const s = st.data?.find((x) => x.user_id === id);
  if (!s) return <ErrorState message="Student not found." />;
  const p = s.profiles!;
  return (
    <div className="space-y-6">
      <Link to="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Students</Link>
      <PageHeader title={`${p.last_name}, ${p.first_name} ${p.middle_name ?? ""}`} description={`${s.student_number} · ${p.is_active ? "Active" : "Inactive"}`} actions={p.is_demo ? <DemoBadge /> : undefined} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Personal information"><dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Email</dt><dd className="truncate">{p.email}</dd><dt className="text-muted-foreground">Contact</dt><dd>{p.contact_number ?? "—"}</dd>
          <dt className="text-muted-foreground">Registered</dt><dd>{format(new Date(s.created_at), "MMM d, yyyy")}</dd></dl></Card>
        <Card title="Academic information"><dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Student ID</dt><dd className="font-mono">{s.student_number}</dd><dt className="text-muted-foreground">Program</dt><dd>{s.program}</dd>
          <dt className="text-muted-foreground">Year / Section</dt><dd>{s.year_level} / {s.section ?? "—"}</dd></dl></Card>
      </div>
      <section><h2 className="mb-3 font-semibold">Current clearance</h2>
        {!current ? <EmptyState title="No active clearance." /> : detail.data ? <div className="space-y-4"><RequestSummary r={detail.data} /><OfficeCards r={detail.data} mode="admin" /></div> : <ListSkeleton rows={2} />}</section>
      <Card title="Clearance history">
        {(reqs.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No clearance requests yet.</p> : (
          <ul className="divide-y">{reqs.data!.map((r) => (
            <li key={r.id}><Link to="/admin/requests/$id" params={{ id: r.id }} className="flex flex-wrap items-center gap-3 py-2.5 text-sm hover:bg-muted/40">
              <span className="font-mono font-semibold">{r.reference_no}</span><span className="text-muted-foreground">{r.semester} {r.school_year}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span><span className="ml-auto"><StatusBadge status={r.status} /></span></Link></li>
          ))}</ul>)}
      </Card>
      <Card title="Approval & activity history">
        {(logs.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No activity.</p> : (
          <ul className="space-y-2 text-sm">{logs.data!.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b pb-2"><span>{l.action}{l.details ? ` — ${l.details}` : ""}</span>
              <span className="text-xs text-muted-foreground">{l.previous_status ? `${l.previous_status} → ` : ""}{l.new_status ?? ""} · {format(new Date(l.created_at), "MMM d, h:mm a")}</span></li>
          ))}</ul>)}
      </Card>
    </div>
  );
}
