import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Gauge, ListChecks, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, StatCard } from "@/components/states";
import { RequestTable, type Row } from "@/components/request-table";
import { meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/staff/")({ component: Dash });

export function hoursLabel(h: number | null) {
  if (h == null) return "—";
  return h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
}

function Dash() {
  const me = useSuspenseQuery(meQuery).data as Me;
  const q = useQuery({
    queryKey: ["queue", me.officeId],
    enabled: !!me.officeId,
    queryFn: async () => {
      const { data, error } = await supabase.from("clearance_items")
        .select("id, status, reviewed_at, reviewed_by, updated_at, clearance_requests!inner(id, reference_no, created_at, status, students!inner(student_number, program, year_level, profiles!students_user_id_fkey(first_name, last_name)))")
        .eq("office_id", me.officeId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (!me.officeId) return <EmptyState title="You're not assigned to an office yet." description="Ask the administrator to assign you to a clearance office." />;
  type R = { id: string; reference_no: string; created_at: string; status: string; students: { student_number: string; program: string; year_level: number; profiles: { first_name: string; last_name: string } | null } };
  const data = (q.data ?? []).filter((i) => (i.clearance_requests as unknown as R).status !== "cancelled");
  const rows: Row[] = data.map((i) => {
    const r = i.clearance_requests as unknown as R;
    return { key: i.id, requestId: r.id, reference: r.reference_no, studentNumber: r.students.student_number, name: `${r.students.profiles?.last_name}, ${r.students.profiles?.first_name}`,
      program: r.students.program, year: r.students.year_level, requested: r.created_at, status: i.status, updated: i.updated_at };
  });
  const today = new Date().toDateString();
  const reviewed = data.filter((i) => i.reviewed_at);
  const isToday = (d: string | null) => d && new Date(d).toDateString() === today;
  const avg = reviewed.length ? reviewed.reduce((s, i) => s + (new Date(i.reviewed_at!).getTime() - new Date((i.clearance_requests as unknown as R).created_at).getTime()), 0) / reviewed.length / 36e5 : null;
  return (
    <div className="space-y-6">
      <PageHeader title={`${me.officeName} Dashboard`} description="Clearance requests assigned to your office." />
      {q.isLoading ? <ListSkeleton rows={6} /> : q.isError ? <ErrorState message="Unable to load clearance requests." onRetry={() => q.refetch()} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Pending" value={data.filter((i) => i.status === "pending").length} icon={<Clock className="h-5 w-5" />} tone="warning" />
            <StatCard label="Approved today" value={data.filter((i) => i.status === "approved" && isToday(i.reviewed_at)).length} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
            <StatCard label="Rejected today" value={data.filter((i) => i.status === "rejected" && isToday(i.reviewed_at)).length} icon={<XCircle className="h-5 w-5" />} tone="danger" />
            <StatCard label="Total processed" value={reviewed.length} icon={<ListChecks className="h-5 w-5" />} />
            <StatCard label="Avg. processing" value={hoursLabel(avg)} icon={<Gauge className="h-5 w-5" />} tone="neutral" hint="request → decision" />
          </div>
          <RequestTable rows={rows} base="/staff/requests" statusOptions={["pending", "approved", "rejected"]} />
        </>
      )}
    </div>
  );
}
