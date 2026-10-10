import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { KeyRound, Mail, Plus, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DemoBadge, EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { officesQuery } from "@/lib/admin-data";
import { adminCreateUser, adminSetPassword, adminSetRole } from "@/lib/admin.functions";
import { errMsg, PROGRAMS, type Role } from "@/lib/session";
import { StudentDialog } from "./admin.students";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: P });

type U = { id: string; email: string; first_name: string; last_name: string; is_active: boolean; is_demo: boolean; role: Role; office_id: string | null };

const usersQuery = {
  queryKey: ["admin", "users"],
  queryFn: async (): Promise<U[]> => {
    const [p, r, o] = await Promise.all([
      supabase.from("profiles").select("id, email, first_name, last_name, is_active, is_demo").order("last_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("office_staff").select("user_id, office_id"),
    ]);
    if (p.error) throw p.error;
    return (p.data ?? []).map((x) => {
      const roles = (r.data ?? []).filter((y) => y.user_id === x.id).map((y) => y.role);
      return { ...x, role: (roles.includes("admin") ? "admin" : roles.includes("staff") ? "staff" : "student") as Role, office_id: o.data?.find((y) => y.user_id === x.id)?.office_id ?? null };
    });
  },
};

function P() {
  const q = useQuery(usersQuery);
  const offices = useQuery(officesQuery);
  const qc = useQueryClient();
  const [s, setS] = useState("");
  const [role, setRole] = useState("all");
  const [edit, setEdit] = useState<U | null>(null);
  const [pw, setPw] = useState<U | null>(null);
  const [creating, setCreating] = useState(false);
  const [toggle, setToggle] = useState<U | null>(null);
  const officeName = (id: string | null) => offices.data?.find((o) => o.id === id)?.name;
  const list = useMemo(() => (q.data ?? []).filter((u) => {
    const t = s.trim().toLowerCase();
    return (!t || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(t)) && (role === "all" || u.role === role);
  }), [q.data, s, role]);
  const act = useMutation({
    mutationFn: async (u: U) => {
      const { error } = await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id); if (error) throw error;
      await supabase.rpc("log_activity", { _action: `Admin ${u.is_active ? "deactivated" : "activated"} account`, _details: u.email });
    },
    onSuccess: () => { toast.success("Account status updated"); qc.invalidateQueries({ queryKey: ["admin"] }); setToggle(null); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const sendReset = async (u: U) => {
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success(`Reset link sent to ${u.email}`);
  };
  return (
    <div>
      <PageHeader title="Users" description="Manage accounts, roles, and office assignments." actions={<Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> Create user</Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name or email" value={s} onChange={(e) => setS(e.target.value)} /></div>
        <Select value={role} onValueChange={setRole}><SelectTrigger className="sm:w-48" aria-label="Role"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="student">Students</SelectItem><SelectItem value="staff">Office staff</SelectItem><SelectItem value="admin">Administrators</SelectItem></SelectContent></Select>
      </div>
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : list.length === 0 ? <EmptyState title="No users found." /> : (
        <div className="space-y-2">{list.map((u) => (
          <div key={u.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">{u.last_name}, {u.first_name} {u.is_demo && <DemoBadge />}
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold capitalize text-accent-foreground">{u.role === "staff" ? `Staff · ${officeName(u.office_id) ?? "No office"}` : u.role}</span></p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <label className="flex items-center gap-2 text-xs"><Switch checked={u.is_active} onCheckedChange={() => setToggle(u)} aria-label="Active" />{u.is_active ? "Active" : "Inactive"}</label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEdit(u)}><Shield className="mr-1 h-4 w-4" /> Role / office</Button>
              <Button size="sm" variant="outline" onClick={() => setPw(u)}><KeyRound className="mr-1 h-4 w-4" /> Set password</Button>
              <Button size="sm" variant="ghost" onClick={() => sendReset(u)}><Mail className="mr-1 h-4 w-4" /> Send reset link</Button>
            </div>
          </div>
        ))}</div>
      )}
      {edit && <RoleDialog u={edit} onClose={() => setEdit(null)} />}
      {pw && <PasswordDialog u={pw} onClose={() => setPw(null)} />}
      {creating && <CreateDialog onClose={() => setCreating(false)} />}
      <AlertDialog open={!!toggle} onOpenChange={(o) => !o && setToggle(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{toggle?.is_active ? "Deactivate" : "Activate"} {toggle?.email}?</AlertDialogTitle>
          <AlertDialogDescription>{toggle?.is_active ? "They will be signed out and can't sign in, request, or review clearances until reactivated." : "They will be able to sign in again."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => toggle && act.mutate(toggle)}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleDialog({ u, onClose }: { u: U; onClose: () => void }) {
  const qc = useQueryClient();
  const offices = useQuery(officesQuery);
  const setRoleFn = useServerFn(adminSetRole);
  const [role, setRole] = useState<Role>(u.role);
  const [office, setOffice] = useState(u.office_id ?? "");
  const m = useMutation({
    mutationFn: async () => { if (role === "staff" && !office) throw new Error("Choose an office for this staff member"); await setRoleFn({ data: { user_id: u.id, role, office_id: role === "staff" ? office : null } }); },
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin"] }); onClose(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent><DialogHeader><DialogTitle>Role & office · {u.first_name} {u.last_name}</DialogTitle><DialogDescription>Changing a role takes effect the next time they open the app.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Role</Label><Select value={role} onValueChange={(v) => setRole(v as Role)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="staff">Office staff</SelectItem><SelectItem value="admin">Administrator</SelectItem></SelectContent></Select></div>
          {role === "staff" && <div className="space-y-1.5"><Label>Assigned office</Label><Select value={office} onValueChange={setOffice}><SelectTrigger><SelectValue placeholder="Choose office" /></SelectTrigger>
            <SelectContent>{offices.data?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} disabled={m.isPending}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ u, onClose }: { u: U; onClose: () => void }) {
  const fn = useServerFn(adminSetPassword);
  const [p, setP] = useState("");
  const m = useMutation({ mutationFn: () => fn({ data: { user_id: u.id, password: p } }), onSuccess: () => { toast.success("Password updated"); onClose(); }, onError: (e) => toast.error(errMsg(e)) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent><DialogHeader><DialogTitle>Set a new password</DialogTitle><DialogDescription>For {u.email}. Share it with them securely.</DialogDescription></DialogHeader>
        <Input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} disabled={p.length < 8 || m.isPending}>Update password</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState<Role | null>(null);
  const qc = useQueryClient();
  const offices = useQuery(officesQuery);
  const create = useServerFn(adminCreateUser);
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", password: "", office_id: "" });
  const m = useMutation({
    mutationFn: async () => {
      if (!f.first_name.trim() || !f.last_name.trim()) throw new Error("Name is required");
      if (role === "staff" && !f.office_id) throw new Error("Choose an office");
      await create({ data: { ...f, role: role!, office_id: role === "staff" ? f.office_id : undefined } });
    },
    onSuccess: () => { toast.success("Account created"); qc.invalidateQueries({ queryKey: ["admin"] }); onClose(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  if (role === "student") return <StudentDialog student={null} onClose={onClose} />;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent><DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
        {!role ? (
          <div className="grid gap-2">{(["student", "staff", "admin"] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} className="rounded-xl border p-3 text-left hover:border-primary hover:bg-accent">
              <p className="font-semibold capitalize">{r === "staff" ? "Office staff" : r === "admin" ? "Administrator" : "Student"}</p></button>))}
            <p className="text-xs text-muted-foreground">Programs available: {PROGRAMS.length}</p></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(["first_name", "last_name", "email", "password"] as const).map((k) => (
              <div key={k} className="space-y-1.5"><Label htmlFor={k} className="capitalize">{k.replace("_", " ")}</Label><Input id={k} type={k === "password" ? "password" : k === "email" ? "email" : "text"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>))}
            {role === "staff" && <div className="space-y-1.5 sm:col-span-2"><Label>Office</Label><Select value={f.office_id} onValueChange={(v) => setF({ ...f, office_id: v })}><SelectTrigger><SelectValue placeholder="Choose office" /></SelectTrigger>
              <SelectContent>{offices.data?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>}
          </div>
        )}
        {role && <DialogFooter><Button variant="outline" onClick={() => setRole(null)}>Back</Button><Button onClick={() => m.mutate()} disabled={m.isPending}>Create {role}</Button></DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
