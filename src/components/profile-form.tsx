import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, PageHeader } from "@/components/states";
import { settingsQuery } from "@/lib/clearance";
import { errMsg, PROGRAMS, type Me } from "@/lib/session";

const schema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  middle_name: z.string().trim().max(80),
  contact_number: z.string().trim().regex(/^((09|\+639)\d{9})?$/, "Use 09XXXXXXXXX"),
});

export function ProfileForm({ me }: { me: Me }) {
  const qc = useQueryClient();
  const settings = useQuery(settingsQuery);
  const canEditAcad = !!settings.data?.allow_academic_edit;
  const [f, setF] = useState({
    first_name: me.profile.first_name, last_name: me.profile.last_name, middle_name: me.profile.middle_name ?? "", contact_number: me.profile.contact_number ?? "",
    program: me.student?.program ?? "", year_level: String(me.student?.year_level ?? 1), section: me.student?.section ?? "",
  });
  const [pw, setPw] = useState({ current: "", next: "" });
  const save = useMutation({
    mutationFn: async () => {
      const p = schema.parse(f);
      const { error } = await supabase.from("profiles").update({ ...p, middle_name: p.middle_name || null, contact_number: p.contact_number || null }).eq("id", me.id);
      if (error) throw error;
      if (me.student && canEditAcad) {
        const { error: e2 } = await supabase.from("students").update({ program: f.program, year_level: Number(f.year_level), section: f.section.trim().slice(0, 20) || null }).eq("user_id", me.id);
        if (e2) throw e2;
      }
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e) => toast.error(e instanceof z.ZodError ? e.issues[0].message : errMsg(e)),
  });
  const changePw = useMutation({
    mutationFn: async () => {
      if (pw.next.length < 8) throw new Error("New password must be at least 8 characters.");
      const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as { password: string });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Password changed"); setPw({ current: "", next: "" }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Keep your contact details up to date." />
      <Card title="Personal information">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          {me.student && (
            <div className="space-y-1.5"><Label className="flex items-center gap-1">Student ID <Lock className="h-3 w-3" /></Label><Input value={me.student.student_number} disabled /></div>
          )}
          <div className="space-y-1.5"><Label className="flex items-center gap-1">Email <Lock className="h-3 w-3" /></Label><Input value={me.email} disabled /></div>
          <div className="space-y-1.5"><Label htmlFor="ln">Last name</Label><Input id="ln" value={f.last_name} onChange={set("last_name")} /></div>
          <div className="space-y-1.5"><Label htmlFor="fn">First name</Label><Input id="fn" value={f.first_name} onChange={set("first_name")} /></div>
          <div className="space-y-1.5"><Label htmlFor="mn">Middle name</Label><Input id="mn" value={f.middle_name} onChange={set("middle_name")} /></div>
          <div className="space-y-1.5"><Label htmlFor="cn">Contact number</Label><Input id="cn" inputMode="tel" value={f.contact_number} onChange={set("contact_number")} /></div>
          {me.student && (
            <>
              <div className="sm:col-span-2 mt-2 flex items-center gap-2 border-t pt-4 text-sm font-semibold">Academic information {!canEditAcad && <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground"><Lock className="h-3 w-3" /> Locked by the administrator</span>}</div>
              <div className="space-y-1.5"><Label>Program</Label>
                <Select value={f.program} onValueChange={(v) => setF({ ...f, program: v })} disabled={!canEditAcad}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[...new Set([...PROGRAMS, f.program])].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Year level</Label>
                <Select value={f.year_level} onValueChange={(v) => setF({ ...f, year_level: v })} disabled={!canEditAcad}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label htmlFor="sec">Section</Label><Input id="sec" value={f.section} onChange={set("section")} disabled={!canEditAcad} /></div>
            </>
          )}
          <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save changes</Button></div>
        </form>
      </Card>
      <Card title="Change password">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); changePw.mutate(); }}>
          <div className="space-y-1.5"><Label htmlFor="cp">Current password</Label><Input id="cp" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="np">New password</Label><Input id="np" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <div className="sm:col-span-2"><Button type="submit" variant="outline" disabled={changePw.isPending || !pw.current || !pw.next}>Update password</Button></div>
        </form>
      </Card>
    </div>
  );
}
