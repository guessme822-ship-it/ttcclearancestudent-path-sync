import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { officesQuery, type OfficeRow } from "@/lib/admin-data";
import { errMsg } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin/offices")({ component: P });
type O = OfficeRow;

const log = (a: string, d?: string) => supabase.rpc("log_activity", { _action: a, _details: d });

function P() {
  const q = useQuery(officesQuery);
  const qc = useQueryClient();
  const [edit, setEdit] = useState<O | "new" | null>(null);
  const [del, setDel] = useState<O | null>(null);
  const inv = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const update = useMutation({
    mutationFn: async ({ id, patch, msg }: { id: string; patch: { is_active?: boolean; sort_order?: number }; msg?: string }) => {
      const { error } = await supabase.from("offices").update(patch).eq("id", id); if (error) throw error; if (msg) await log(msg);
    },
    onSuccess: inv, onError: (e) => toast.error(errMsg(e)),
  });
  const move = async (i: number, dir: -1 | 1) => {
    const L = q.data!; const a = L[i], b = L[i + dir]; if (!b) return;
    await update.mutateAsync({ id: a.id, patch: { sort_order: b.sort_order === a.sort_order ? b.sort_order + dir : b.sort_order } });
    await update.mutateAsync({ id: b.id, patch: { sort_order: a.sort_order }, msg: `Admin reordered offices (${a.name})` });
    toast.success("Order updated");
  };
  const remove = useMutation({
    mutationFn: async (o: O) => {
      const { error } = await supabase.from("offices").delete().eq("id", o.id);
      if (error) throw new Error(error.code === "23503" ? "This office has clearance history. Deactivate it instead." : error.message);
      await log("Admin removed office", o.name);
    },
    onSuccess: () => { toast.success("Office removed"); inv(); }, onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <div>
      <PageHeader title="Offices" description="Active offices, in this order, are added to every new clearance request. Changes don't affect requests already submitted." actions={<Button onClick={() => setEdit("new")}><Plus className="mr-1 h-4 w-4" /> Add office</Button>} />
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : q.data!.length === 0 ? <EmptyState title="No offices yet." /> : (
        <ol className="space-y-2">{q.data!.map((o, i) => (
          <li key={o.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent font-bold text-accent-foreground">{i + 1}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{o.name}</p><p className="text-xs text-muted-foreground">{o.description}</p>
              <p className="text-xs">Staff: {o.office_staff.map((s) => `${s.profiles?.first_name} ${s.profiles?.last_name}`).join(", ") || <span className="text-danger">None assigned — assign in Users</span>}</p></div>
            <div className="flex items-center gap-1">
              <label className="mr-2 flex items-center gap-2 text-xs"><Switch checked={o.is_active} onCheckedChange={(v) => update.mutate({ id: o.id, patch: { is_active: v }, msg: `Admin ${v ? "activated" : "deactivated"} office ${o.name}` })} aria-label="Active" />{o.is_active ? "Active" : "Inactive"}</label>
              <Button size="icon" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Move down" disabled={i === q.data!.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEdit(o)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Remove" className="text-danger" onClick={() => setDel(o)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}</ol>
      )}
      {edit && <OfficeDialog office={edit === "new" ? null : edit} nextOrder={(q.data?.at(-1)?.sort_order ?? 0) + 1} onClose={() => setEdit(null)} />}
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove {del?.name}?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes the office. Offices with clearance history can only be deactivated.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => del && remove.mutate(del)}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OfficeDialog({ office, nextOrder, onClose }: { office: O | null; nextOrder: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(office?.name ?? "");
  const [desc, setDesc] = useState(office?.description ?? "");
  const m = useMutation({
    mutationFn: async () => {
      const n = name.trim(); if (n.length < 2 || n.length > 80) throw new Error("Office name must be 2–80 characters");
      const r = office ? await supabase.from("offices").update({ name: n, description: desc.trim().slice(0, 300) || null }).eq("id", office.id)
        : await supabase.from("offices").insert({ name: n, description: desc.trim().slice(0, 300) || null, sort_order: nextOrder });
      if (r.error) throw new Error(r.error.code === "23505" ? "An office with that name already exists" : r.error.message);
      await log(office ? "Admin edited office" : "Admin created new office", n);
    },
    onSuccess: () => { toast.success(office ? "Office updated" : "Office created"); qc.invalidateQueries({ queryKey: ["admin"] }); onClose(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent><DialogHeader><DialogTitle>{office ? "Edit office" : "Add office"}</DialogTitle></DialogHeader>
        <div className="space-y-3"><div className="space-y-1.5"><Label htmlFor="on">Office name</Label><Input id="on" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="od">Description</Label><Textarea id="od" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Assign staff to this office from the Users page.</p></div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} disabled={m.isPending}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
