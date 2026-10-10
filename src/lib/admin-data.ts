import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminReq = {
  id: string; reference_no: string; status: string; created_at: string; updated_at: string; completed_at: string | null; school_year: string; semester: string;
  students: { student_number: string; program: string; year_level: number; profiles: { first_name: string; last_name: string; is_demo: boolean } | null };
  clearance_items: { id: string; status: string; office_id: string; reviewed_at: string | null; updated_at: string; offices: { name: string } | null }[];
};

export const adminRequestsQuery = queryOptions({
  queryKey: ["admin", "requests"],
  queryFn: async () => {
    const { data, error } = await supabase.from("clearance_requests")
      .select("id, reference_no, status, created_at, updated_at, completed_at, school_year, semester, students!inner(student_number, program, year_level, profiles!students_user_id_fkey(first_name, last_name, is_demo)), clearance_items(id, status, office_id, reviewed_at, updated_at, offices(name))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as AdminReq[];
  },
});

export type AdminStudent = {
  user_id: string; student_number: string; program: string; year_level: number; section: string | null; created_at: string;
  profiles: { first_name: string; last_name: string; middle_name: string | null; email: string; contact_number: string | null; is_active: boolean; is_demo: boolean } | null;
};

export const adminStudentsQuery = queryOptions({
  queryKey: ["admin", "students"],
  queryFn: async () => {
    const { data, error } = await supabase.from("students").select("*, profiles!students_user_id_fkey(first_name, last_name, middle_name, email, contact_number, is_active, is_demo)").order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as AdminStudent[];
  },
});

export const officesQuery = queryOptions({
  queryKey: ["admin", "offices"],
  queryFn: async () => {
    const { data, error } = await supabase.from("offices").select("*, office_staff(user_id, profiles!office_staff_user_id_fkey(first_name, last_name))").order("sort_order");
    if (error) throw error;
    return data as unknown as OfficeRow[];
  },
});

export type OfficeRow = { id: string; name: string; description: string | null; is_active: boolean; sort_order: number; office_staff: { user_id: string; profiles: { first_name: string; last_name: string } | null }[] };
