import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { StatusBadge } from "@/components/status";

export const Route = createFileRoute("/_authenticated/admin/logs")({ component: P });

function P() {
  const q = useQuery({
    queryKey: ["admin", "logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_logs")
        .select("id, action, created_at, previous_status, new_status, details, request_id, actor:profiles!activity_logs_actor_id_fkey(first_name, last_name, email), req:clearance_requests(reference_no)")
        .order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as unknown as { id: string; action: string; created_at: string; previous_status: string | null; new_status: string | null; details: string | null; request_id: string | null; actor: { first_name: string; last_name: string; email: string } | null; req: { reference_no: string } | null }[];
    },
  });
  const [s, setS] = useState("");
  const [date, setDate] = useState("");
  const list = useMemo(() => (q.data ?? []).filter((l) => {
    const t = s.toLowerCase();
    return (!t || `${l.action} ${l.actor?.first_name} ${l.actor?.last_name} ${l.req?.reference_no ?? ""} ${l.details ?? ""}`.toLowerCase().includes(t)) && (!date || l.created_at.slice(0, 10) === date);
  }), [q.data, s, date]);
  return (
    <div>
      <PageHeader title="Activity Logs" description="Complete audit trail of system actions (latest 500)." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search user, action, reference no." value={s} onChange={(e) => setS(e.target.value)} /></div>
        <Input type="date" className="sm:w-48" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      </div>
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : list.length === 0 ? <EmptyState title="No activity found." /> : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <ul className="divide-y">{list.map((l) => (
            <li key={l.id} className="grid gap-1 p-4 text-sm md:grid-cols-[1.3fr_2fr_1fr_1.2fr] md:items-center">
              <div><p className="font-medium">{l.actor ? `${l.actor.first_name} ${l.actor.last_name}` : "System"}</p><p className="text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d, yyyy · h:mm:ss a")}</p></div>
              <div><p>{l.action}</p>{l.details && <p className="truncate text-xs text-muted-foreground">{l.details}</p>}</div>
              <div>{l.req && l.request_id ? <Link to="/admin/requests/$id" params={{ id: l.request_id }} className="font-mono text-xs text-primary hover:underline">{l.req.reference_no}</Link> : <span className="text-xs text-muted-foreground">—</span>}</div>
              <div className="flex flex-wrap items-center gap-1">{l.previous_status && <><StatusBadge status={l.previous_status} /><span className="text-xs">→</span></>}{l.new_status && <StatusBadge status={l.new_status} />}</div>
            </li>
          ))}</ul>
        </div>
      )}
    </div>
  );
}
