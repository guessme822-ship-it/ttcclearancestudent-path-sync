import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, ListSkeleton, PageHeader } from "@/components/states";
import { settingsQuery } from "@/lib/clearance";
import { adminDeleteDemoData } from "@/lib/admin.functions";
import { errMsg } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: P });

function P() {
  const q = useQuery(settingsQuery);
  const qc = useQueryClient();
  const del = useServerFn(adminDeleteDemoData);
  const [f, setF] = useState({ school_year: "", semester: "", allow_academic_edit: false });
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { if (q.data) setF({ school_year: q.data.school_year, semester: q.data.semester, allow_academic_edit: q.data.allow_academic_edit }); }, [q.data]);
  const save = useMutation({
    mutationFn: async () => {
      if (!/^\d{4}-\d{4}$/.test(f.school_year)) throw new Error("School year must look like 2026-2027");
      const { error } = await supabase.from("settings").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1); if (error) throw error;
      await supabase.rpc("log_activity", { _action: "Admin updated system settings", _details: `${f.semester} ${f.school_year}` });
    },
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const wipe = useMutation({ mutationFn: () => del(), onSuccess: (r) => { toast.success(`${r.removed} demo accounts and their records removed`); qc.invalidateQueries(); setConfirm(false); }, onError: (e) => toast.error(errMsg(e)) });
  if (q.isLoading) return <ListSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Applies to all new clearance requests." />
      <Card title="Academic term">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="sy">School year</Label><Input id="sy" value={f.school_year} onChange={(e) => setF({ ...f, school_year: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Semester</Label><Select value={f.semester} onValueChange={(v) => setF({ ...f, semester: v })}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["1st Semester", "2nd Semester", "Summer"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <label className="flex items-start gap-3 rounded-xl border p-3 sm:col-span-2"><Switch checked={f.allow_academic_edit} onCheckedChange={(v) => setF({ ...f, allow_academic_edit: v })} />
            <span className="text-sm"><b>Let students edit program, year level and section</b><br /><span className="text-muted-foreground">Student ID can never be changed by students.</span></span></label>
        </div>
        <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>Save settings</Button>
      </Card>
      <Card title="Demo data">
        <p className="text-sm text-muted-foreground">Sample accounts (marked DEMO) let you try the system. Remove them before going live — this deletes every demo account and its clearance records, except your own account.</p>
        <Button variant="destructive" className="mt-4" onClick={() => setConfirm(true)}><Trash2 className="mr-1 h-4 w-4" /> Delete all demo data</Button>
      </Card>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete all demo data?</AlertDialogTitle><AlertDialogDescription>This permanently removes demo accounts, their clearance requests, and notifications. This can't be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={(e) => { e.preventDefault(); wipe.mutate(); }} disabled={wipe.isPending}>Delete demo data</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
