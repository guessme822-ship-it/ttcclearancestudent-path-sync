import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/status";
import { PROGRAMS } from "@/lib/session";

export type Row = {
  key: string; requestId: string; reference: string; studentNumber: string; name: string; program: string; year: number;
  requested: string; status: string; updated: string; office?: string;
};

export function RequestTable({ rows, base, statusOptions, offices }: { rows: Row[]; base: "/staff/requests" | "/admin/requests"; statusOptions: string[]; offices?: string[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [program, setProgram] = useState("all");
  const [year, setYear] = useState("all");
  const [office, setOffice] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = rows.filter((r) =>
      (!s || r.name.toLowerCase().includes(s) || r.studentNumber.includes(s) || r.reference.toLowerCase().includes(s)) &&
      (status === "all" || r.status === status) && (program === "all" || r.program === program) &&
      (year === "all" || String(r.year) === year) && (office === "all" || r.office === office) &&
      (!from || r.requested >= from) && (!to || r.requested.slice(0, 10) <= to));
    const cmp: Record<string, (a: Row, b: Row) => number> = {
      newest: (a, b) => b.requested.localeCompare(a.requested), oldest: (a, b) => a.requested.localeCompare(b.requested),
      name: (a, b) => a.name.localeCompare(b.name), updated: (a, b) => b.updated.localeCompare(a.updated),
    };
    return out.sort(cmp[sort]);
  }, [rows, q, status, program, year, office, from, to, sort]);
  const programs = [...new Set([...PROGRAMS, ...rows.map((r) => r.program)])];
  const sel = (v: string, set: (s: string) => void, ph: string, opts: [string, string][]) => (
    <Select value={v} onValueChange={set}><SelectTrigger aria-label={ph} className="h-10"><SelectValue placeholder={ph} /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {ph.toLowerCase()}</SelectItem>{opts.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
  );
  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="h-10 pl-9" placeholder="Search name, Student ID, or reference no." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /></div>
        {sel(status, setStatus, "Status", statusOptions.map((s) => [s, s.replace("_", " ")]))}
        {sel(program, setProgram, "Programs", programs.map((p) => [p, p]))}
        {sel(year, setYear, "Year levels", [1, 2, 3, 4, 5].map((y) => [String(y), `Year ${y}`]))}
        {offices && sel(office, setOffice, "Offices", offices.map((o) => [o, o]))}
        <Input type="date" className="h-10" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" className="h-10" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="h-10" aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem><SelectItem value="name">Name A–Z</SelectItem><SelectItem value="updated">Recently updated</SelectItem></SelectContent></Select>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{list.length} of {rows.length} requests</p>
      {list.length === 0 ? <EmptyState title="No clearance requests found." description="Try changing your search or filters." /> : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-soft md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3">Student ID</th><th>Student name</th><th>Program</th><th>Year</th>{offices && <th>Office</th>}<th>Request date</th><th>Status</th><th>Last updated</th><th className="pr-4 text-right">Action</th></tr>
              </thead>
              <tbody>{list.map((r) => (
                <tr key={r.key} className="border-t transition hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs">{r.studentNumber}</td><td className="font-medium">{r.name}</td><td className="text-xs">{r.program}</td><td>{r.year}</td>
                  {offices && <td className="text-xs">{r.office}</td>}
                  <td className="text-xs">{format(new Date(r.requested), "MMM d, yyyy")}</td><td><StatusBadge status={r.status} /></td>
                  <td className="text-xs text-muted-foreground">{format(new Date(r.updated), "MMM d, h:mm a")}</td>
                  <td className="pr-4 text-right"><Link to={`${base}/$id`} params={{ id: r.requestId }} className="text-sm font-semibold text-primary hover:underline">Review</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className="space-y-2 md:hidden">{list.map((r) => (
            <li key={r.key}><Link to={`${base}/$id`} params={{ id: r.requestId }} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{r.name}</p><StatusBadge status={r.status} /></div>
                <p className="text-xs text-muted-foreground">{r.studentNumber} · {r.program} · Y{r.year}{r.office ? ` · ${r.office}` : ""}</p>
                <p className="text-xs text-muted-foreground">Requested {format(new Date(r.requested), "MMM d, yyyy")}</p>
              </div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link></li>
          ))}</ul>
        </>
      )}
    </div>
  );
}
