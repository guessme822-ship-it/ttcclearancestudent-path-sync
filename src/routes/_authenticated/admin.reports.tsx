import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, ErrorState, ListSkeleton, PageHeader, StatCard } from "@/components/states";
import { adminRequestsQuery } from "@/lib/admin-data";
import { PROGRAMS } from "@/lib/session";
import { ClipboardList, Award, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: P });

function P() {
  const q = useQuery(adminRequestsQuery);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [program, setProgram] = useState("all");
  const [status, setStatus] = useState("all");
  const [demo, setDemo] = useState("all");
  const R = useMemo(() => (q.data ?? []).filter((r) => (!from || r.created_at >= from) && (!to || r.created_at.slice(0, 10) <= to) &&
    (program === "all" || r.students.program === program) && (status === "all" || r.status === status) &&
    (demo === "all" || (demo === "demo") === !!r.students.profiles?.is_demo)), [q.data, from, to, program, status, demo]);
  if (q.isLoading) return <ListSkeleton rows={6} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const c = (s: string) => R.filter((r) => r.status === s).length;
  const offices = [...new Set(R.flatMap((r) => r.clearance_items.map((i) => i.offices?.name ?? "")))];
  const officeStats = offices.map((o) => { const it = R.flatMap((r) => r.clearance_items).filter((i) => i.offices?.name === o);
    return { o, total: it.length, a: it.filter((i) => i.status === "approved").length, p: it.filter((i) => i.status === "pending").length, x: it.filter((i) => i.status === "rejected").length }; });
  const byProgram = Object.entries(R.reduce<Record<string, Record<string, number>>>((a, r) => { const k = r.students.program; a[k] ??= { total: 0, completed: 0 }; a[k].total++; if (r.status === "completed") a[k].completed++; return a; }, {}));
  const byDate = Object.entries(R.reduce<Record<string, number>>((a, r) => { const d = r.created_at.slice(0, 10); a[d] = (a[d] ?? 0) + 1; return a; }, {})).sort((a, b) => b[0].localeCompare(a[0]));
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description={`Generated ${format(new Date(), "MMMM d, yyyy h:mm a")} · Torres Capitol College, Inc.`} actions={<Button onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print report</Button>} />
      <div className="no-print grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        <Select value={program} onValueChange={setProgram}><SelectTrigger aria-label="Program"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All programs</SelectItem>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["in_progress", "completed", "rejected", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
        <Select value={demo} onValueChange={setDemo}><SelectTrigger aria-label="Data"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Real & demo data</SelectItem><SelectItem value="real">Real records only</SelectItem><SelectItem value="demo">Demo only</SelectItem></SelectContent></Select>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total requests" value={R.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Completed" value={c("completed")} icon={<Award className="h-5 w-5" />} tone="success" />
        <StatCard label="Pending" value={c("in_progress")} icon={<Clock className="h-5 w-5" />} tone="warning" />
        <StatCard label="Rejected" value={c("rejected")} icon={<XCircle className="h-5 w-5" />} tone="danger" />
      </div>
      <Card title="Office approval statistics" className="print-area">
        <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Office</th><th>Total</th><th>Approved</th><th>Pending</th><th>Rejected</th><th>Approval rate</th></tr></thead>
          <tbody>{officeStats.map((s) => <tr key={s.o} className="border-b"><td className="py-2 font-medium">{s.o}</td><td>{s.total}</td><td>{s.a}</td><td>{s.p}</td><td>{s.x}</td><td>{s.total ? Math.round((s.a / s.total) * 100) : 0}%</td></tr>)}</tbody></table>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Clearance requests by program" className="print-area">
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Program</th><th>Requests</th><th>Completed</th></tr></thead>
            <tbody>{byProgram.map(([p, v]) => <tr key={p} className="border-b"><td className="py-2">{p}</td><td>{v.total}</td><td>{v.completed}</td></tr>)}</tbody></table>
        </Card>
        <Card title="Clearance requests by date" className="print-area">
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Date</th><th>Requests</th></tr></thead>
            <tbody>{byDate.map(([d, n]) => <tr key={d} className="border-b"><td className="py-2">{format(new Date(d), "MMM d, yyyy")}</td><td>{n}</td></tr>)}</tbody></table>
        </Card>
      </div>
    </div>
  );
}
