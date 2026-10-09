import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Award, Building2, CalendarClock, Clock, GraduationCap, UserCheck, XCircle } from "lucide-react";
import { Card, ErrorState, ListSkeleton, PageHeader, StatCard } from "@/components/states";
import { adminRequestsQuery, adminStudentsQuery, officesQuery } from "@/lib/admin-data";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dash });

const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--neutral)"];

function Dash() {
  const reqs = useQuery(adminRequestsQuery);
  const studs = useQuery(adminStudentsQuery);
  const offs = useQuery(officesQuery);
  if (reqs.isLoading || studs.isLoading || offs.isLoading) return <ListSkeleton rows={6} />;
  if (reqs.isError || studs.isError || offs.isError) return <ErrorState onRetry={() => { reqs.refetch(); studs.refetch(); offs.refetch(); }} />;
  const R = reqs.data!, S = studs.data!, O = offs.data!;
  const today = new Date().toDateString();
  const count = (s: string) => R.filter((r) => r.status === s).length;
  const statusData = [["Completed", count("completed")], ["In progress", count("in_progress")], ["Rejected", count("rejected")], ["Cancelled", count("cancelled")]].map(([name, value]) => ({ name, value })).filter((d) => (d.value as number) > 0);
  const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
  const overTime = days.map((d) => ({ day: format(d, "MMM d"), requests: R.filter((r) => new Date(r.created_at).toDateString() === d.toDateString()).length }));
  const officePerf = O.map((o) => {
    const items = R.flatMap((r) => r.clearance_items).filter((i) => i.office_id === o.id);
    return { office: o.name.replace(" Office", ""), approved: items.filter((i) => i.status === "approved").length, pending: items.filter((i) => i.status === "pending").length, rejected: items.filter((i) => i.status === "rejected").length };
  });
  const byProgram = Object.entries(S.reduce<Record<string, number>>((a, s) => ((a[s.program] = (a[s.program] ?? 0) + 1), a), {})).map(([program, students]) => ({ program: program.replace("BS ", ""), students }));
  return (
    <div className="space-y-6">
      <PageHeader title="Administrator Dashboard" description="Overview of clearance activity across Torres Capitol College." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total students" value={S.length} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Active students" value={S.filter((s) => s.profiles?.is_active).length} icon={<UserCheck className="h-5 w-5" />} tone="success" />
        <StatCard label="Pending" value={count("in_progress")} icon={<Clock className="h-5 w-5" />} tone="warning" />
        <StatCard label="Completed" value={count("completed")} icon={<Award className="h-5 w-5" />} tone="success" />
        <StatCard label="Rejected" value={count("rejected")} icon={<XCircle className="h-5 w-5" />} tone="danger" />
        <StatCard label="Offices" value={O.length} icon={<Building2 className="h-5 w-5" />} tone="neutral" />
        <StatCard label="Requests today" value={R.filter((r) => new Date(r.created_at).toDateString() === today).length} icon={<CalendarClock className="h-5 w-5" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Clearance status distribution">
          <div className="h-64">{statusData.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
            <ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              {statusData.map((d, i) => <Cell key={d.name as string} fill={[C[1], C[2], C[3], C[5]][["Completed", "In progress", "Rejected", "Cancelled"].indexOf(d.name as string)] ?? C[i]} />)}
            </Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>)}</div>
        </Card>
        <Card title="Clearance requests · last 14 days">
          <div className="h-64"><ResponsiveContainer><LineChart data={overTime}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Line type="monotone" dataKey="requests" stroke={C[0]} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div>
        </Card>
        <Card title="Office approval performance">
          <div className="h-64"><ResponsiveContainer><BarChart data={officePerf}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="office" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Legend />
            <Bar dataKey="approved" stackId="a" fill={C[1]} /><Bar dataKey="pending" stackId="a" fill={C[2]} /><Bar dataKey="rejected" stackId="a" fill={C[3]} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="Students by program">
          <div className="h-64"><ResponsiveContainer><BarChart data={byProgram} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis type="number" allowDecimals={false} fontSize={11} /><YAxis type="category" dataKey="program" width={130} fontSize={11} /><Tooltip /><Bar dataKey="students" fill={C[4]} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
    </div>
  );
}
