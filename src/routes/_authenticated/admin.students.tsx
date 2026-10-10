import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DemoBadge, EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { adminStudentsQuery, type AdminStudent } from "@/lib/admin-data";
import { adminCreateUser } from "@/lib/admin.functions";
import { errMsg, PROGRAMS } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin/students")({ component: P });

function P() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/admin/students") return <Outlet />;
  return <StudentList />;
}

function StudentList() {
  const q = useQuery(adminStudentsQuery);
  const qc = useQueryClient();
  const [s, setS] = useState("");
  const [program, setProgram] = useState("all");
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState("all");
  const [demo, setDemo] = useState("all");
  const [edit, setEdit] = useState<AdminStudent | "new" | null>(null);
  const list = useMemo(() => (q.data ?? []).filter((x) => {
    const t = s.trim().toLowerCase();
    const n = `${x.profiles?.first_name} ${x.profiles?.last_name}`.toLowerCase();
    return (!t || n.includes(t) || x.student_number.includes(t) || x.profiles?.email.toLowerCase().includes(t)) &&
      (program === "all" || x.program === program) && (year === "all" || String(x.year_level) === year) &&
      (status === "all" || (status === "active") === !!x.profiles?.is_active) && (demo === "all" || (demo === "demo") === !!x.profiles?.is_demo);
  }), [q.data, s, program, year, status, demo]);
  const toggle = useMutation({
    mutationFn: async (x: AdminStudent) => {
      const { error } = await supabase.from("profiles").update({ is_active: !x.profiles?.is_active }).eq("id", x.user_id); if (error) throw error;
      await supabase.rpc("log_activity", { _action: `Admin ${x.profiles?.is_active ? "deactivated" : "activated"} student`, _details: x.student_number });
    },
    onSuccess: () => { toast.success("Student status updated"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <div>
      <PageHeader title="Students" description="Manage student records and accounts." actions={<Button onClick={() => setEdit("new")}><Plus className="mr-1 h-4 w-4" /> Add student</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-1 sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, ID, email" value={s} onChange={(e) => setS(e.target.value)} /></div>
        <Select value={program} onValueChange={setProgram}><SelectTrigger aria-label="Program"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All programs</SelectItem>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
        <Select value={year} onValueChange={setYear}><SelectTrigger aria-label="Year"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{[1, 2, 3, 4, 5].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Active & inactive</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
        <Select value={demo} onValueChange={setDemo}><SelectTrigger aria-label="Data"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Real & demo</SelectItem><SelectItem value="real">Real records only</SelectItem><SelectItem value="demo">Demo only</SelectItem></SelectContent></Select>
      </div>
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : list.length === 0 ? <EmptyState title="No students found." /> : (
        <div className="space-y-2">{list.map((x) => (
          <div key={x.user_id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold">{x.profiles?.last_name}, {x.profiles?.first_name} {x.profiles?.is_demo && <DemoBadge />}</p>
              <p className="text-xs text-muted-foreground">{x.student_number} · {x.program} · Year {x.year_level}{x.section ? ` · ${x.section}` : ""} · {x.profiles?.email}</p>
            </div>
            <label className="flex items-center gap-2 text-xs"><Switch checked={!!x.profiles?.is_active} onCheckedChange={() => toggle.mutate(x)} aria-label="Active" />{x.profiles?.is_active ? "Active" : "Inactive"}</label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEdit(x)}>Edit</Button>
              <Button size="sm" asChild><Link to="/admin/students/$id" params={{ id: x.user_id }}>View <ChevronRight className="h-4 w-4" /></Link></Button>
            </div>
          </div>
        ))}</div>
      )}
      {edit && <StudentDialog student={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

export function StudentDialog({ student, onClose }: { student: AdminStudent | null; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(adminCreateUser);
  const [f, setF] = useState({
    first_name: student?.profiles?.first_name ?? "", last_name: student?.profiles?.last_name ?? "", middle_name: student?.profiles?.middle_name ?? "",
    contact_number: student?.profiles?.contact_number ?? "", email: student?.profiles?.email ?? "", password: "",
    student_number: student?.student_number ?? "", program: student?.program ?? PROGRAMS[0], year_level: String(student?.year_level ?? 1), section: student?.section ?? "",
  });
  const m = useMutation({
    mutationFn: async () => {
      if (!f.first_name.trim() || !f.last_name.trim() || !/^\d{4}-\d{5}$/.test(f.student_number)) throw new Error("Name and a Student ID like 2024-00123 are required");
      if (student) {
        const a = await supabase.from("profiles").update({ first_name: f.first_name.trim(), last_name: f.last_name.trim(), middle_name: f.middle_name.trim() || null, contact_number: f.contact_number.trim() || null }).eq("id", student.user_id);
        if (a.error) throw a.error;
        const b = await supabase.from("students").update({ student_number: f.student_number, program: f.program, year_level: Number(f.year_level), section: f.section.trim() || null }).eq("user_id", student.user_id);
        if (b.error) throw b.error;
        await supabase.rpc("log_activity", { _action: "Admin edited student record", _details: f.student_number });
      } else {
        if (f.password.length < 8) throw new Error("Temporary password must be at least 8 characters");
        await create({ data: { ...f, role: "student", year_level: Number(f.year_level), middle_name: f.middle_name || undefined, section: f.section || undefined, contact_number: f.contact_number || undefined } });
      }
    },
    onSuccess: () => { toast.success(student ? "Student updated" : "Student account created"); qc.invalidateQueries({ queryKey: ["admin"] }); onClose(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const inp = (k: keyof typeof f, label: string, type = "text", disabled = false) => (
    <div className="space-y-1.5"><Label htmlFor={k}>{label}</Label><Input id={k} type={type} disabled={disabled} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{student ? "Edit student" : "Add student"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {inp("student_number", "Student ID")}{inp("contact_number", "Contact number")}
          {inp("first_name", "First name")}{inp("last_name", "Last name")}{inp("middle_name", "Middle name")}{inp("section", "Section")}
          <div className="space-y-1.5"><Label>Program</Label><Select value={f.program} onValueChange={(v) => setF({ ...f, program: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Year level</Label><Select value={f.year_level} onValueChange={(v) => setF({ ...f, year_level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent></Select></div>
          {inp("email", "Email", "email", !!student)}
          {!student && inp("password", "Temporary password", "password")}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} disabled={m.isPending}>{student ? "Save changes" : "Create student"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
