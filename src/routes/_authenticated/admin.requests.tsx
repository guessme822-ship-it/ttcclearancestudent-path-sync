import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { RequestTable, type Row } from "@/components/request-table";
import { adminRequestsQuery } from "@/lib/admin-data";

export const Route = createFileRoute("/_authenticated/admin/requests")({ component: P });

function P() {
  const q = useQuery(adminRequestsQuery);
  if (q.isLoading) return <ListSkeleton rows={6} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const offices = [...new Set(q.data!.flatMap((r) => r.clearance_items.map((i) => i.offices?.name ?? "")))].filter(Boolean);
  // One row per request; office filter matches any office that still has a pending/rejected item
  const rows: Row[] = q.data!.flatMap((r) => {
    const base = { requestId: r.id, reference: r.reference_no, studentNumber: r.students.student_number, name: `${r.students.profiles?.last_name}, ${r.students.profiles?.first_name}`,
      program: r.students.program, year: r.students.year_level, requested: r.created_at, status: r.status, updated: r.updated_at };
    return r.clearance_items.map((i) => ({ ...base, key: i.id, office: i.offices?.name ?? "" }));
  });
  return (
    <div>
      <PageHeader title="Clearance Requests" description="All clearance requests. Each row is one office for one request — filter by office to see its queue." />
      <RequestTable rows={rows} base="/admin/requests" statusOptions={["in_progress", "completed", "rejected", "cancelled"]} offices={offices} />
    </div>
  );
}
