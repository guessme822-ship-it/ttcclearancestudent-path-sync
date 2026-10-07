import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Item = {
  id: string; request_id: string; office_id: string; sort_order: number; status: string;
  reviewed_by: string | null; reviewed_at: string | null; remarks: string | null; updated_at: string; created_at: string;
  offices: { name: string; description: string | null } | null;
  reviewer: { first_name: string; last_name: string } | null;
};
export type Log = { id: string; action: string; previous_status: string | null; new_status: string | null; details: string | null; created_at: string; actor: { first_name: string; last_name: string } | null };
export type RequestDetail = {
  id: string; reference_no: string; school_year: string; semester: string; status: string; created_at: string; updated_at: string; completed_at: string | null; student_id: string;
  student: { student_number: string; program: string; year_level: number; section: string | null } | null;
  profile: { first_name: string; last_name: string; middle_name: string | null; email: string; contact_number: string | null } | null;
  items: Item[];
  approvers: Record<string, string[]>;
  logs: Log[];
};

export async function fetchRequestDetail(id: string): Promise<RequestDetail | null> {
  const { data: r, error } = await supabase.from("clearance_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!r) return null;
  const [st, pr, it, os, lg] = await Promise.all([
    supabase.from("students").select("student_number, program, year_level, section").eq("user_id", r.student_id).maybeSingle(),
    supabase.from("profiles").select("first_name, last_name, middle_name, email, contact_number").eq("id", r.student_id).maybeSingle(),
    supabase.from("clearance_items").select("*, offices(name, description), reviewer:profiles!clearance_items_reviewed_by_fkey(first_name, last_name)").eq("request_id", id).order("sort_order"),
    supabase.from("office_staff").select("office_id, profiles!office_staff_user_id_fkey(first_name, last_name)"),
    supabase.from("activity_logs").select("id, action, previous_status, new_status, details, created_at, actor:profiles!activity_logs_actor_id_fkey(first_name, last_name)").eq("request_id", id).order("created_at", { ascending: false }),
  ]);
  if (it.error) throw it.error;
  const approvers: Record<string, string[]> = {};
  for (const o of os.data ?? []) {
    const p = o.profiles as { first_name: string; last_name: string } | null;
    if (p) (approvers[o.office_id] ??= []).push(`${p.first_name} ${p.last_name}`);
  }
  return { ...r, student: st.data, profile: pr.data, items: (it.data ?? []) as unknown as Item[], approvers, logs: (lg.data ?? []) as unknown as Log[] };
}

export const requestDetailQuery = (id: string) => queryOptions({ queryKey: ["request", id], queryFn: () => fetchRequestDetail(id) });

export const myRequestsQuery = (uid: string) =>
  queryOptions({
    queryKey: ["my-requests", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("clearance_requests").select("*, clearance_items(status)").eq("student_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export function progressOf(items: { status: string }[]) {
  const total = items.length;
  const approved = items.filter((i) => i.status === "approved").length;
  const rejected = items.filter((i) => i.status === "rejected").length;
  const pending = items.filter((i) => i.status === "pending").length;
  return { total, approved, rejected, pending, pct: total ? Math.round((approved / total) * 100) : 0 };
}

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data;
  },
});

export function yearLabel(y: number) {
  return ["", "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"][y] ?? `Year ${y}`;
}
