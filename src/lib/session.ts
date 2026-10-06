import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "staff" | "student";

export type Me = {
  id: string;
  email: string;
  role: Role;
  profile: {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    contact_number: string | null;
    is_active: boolean;
    is_demo: boolean;
    email: string;
  };
  student: { student_number: string; program: string; year_level: number; section: string | null } | null;
  officeId: string | null;
  officeName: string | null;
};

export async function fetchMe(): Promise<Me | null> {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) return null;
  const [p, r, s, os] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("students").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("office_staff").select("office_id, offices(name)").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!p.data) return null;
  const roles = (r.data ?? []).map((x) => x.role as Role);
  const role: Role = roles.includes("admin") ? "admin" : roles.includes("staff") ? "staff" : "student";
  return {
    id: user.id,
    email: user.email ?? p.data.email,
    role,
    profile: p.data,
    student: s.data ?? null,
    officeId: os.data?.office_id ?? null,
    officeName: (os.data?.offices as { name: string } | null)?.name ?? null,
  };
}

export const meQuery = queryOptions({ queryKey: ["me"], queryFn: fetchMe, staleTime: 60_000 });

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/student";
}

export function fullName(p?: { first_name?: string | null; last_name?: string | null; middle_name?: string | null } | null) {
  if (!p) return "—";
  const mi = p.middle_name ? ` ${p.middle_name.charAt(0)}.` : "";
  return `${p.first_name ?? ""}${mi} ${p.last_name ?? ""}`.trim() || "—";
}

export const PROGRAMS = [
  "BS Information Technology",
  "BS Criminology",
  "BS Education",
  "BS Business Administration",
  "BS Hospitality Management",
  "BS Social Work",
];

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Something went wrong. Please try again.";
}
