import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  middle_name: z.string().trim().max(80).optional(),
  contact_number: z.string().trim().max(30).optional(),
  role: z.enum(["student", "staff", "admin"]),
  office_id: z.string().uuid().optional(),
  student_number: z.string().trim().max(30).optional(),
  program: z.string().trim().max(120).optional(),
  year_level: z.number().int().min(1).max(6).optional(),
  section: z.string().trim().max(20).optional(),
});

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.role === "student" && !data.student_number) throw new Error("Student ID is required for students");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { first_name: data.first_name, last_name: data.last_name, middle_name: data.middle_name, contact_number: data.contact_number,
        role: data.role, student_number: data.role === "student" ? data.student_number : undefined, program: data.program, year_level: data.year_level, section: data.section },
    });
    if (error) throw new Error(error.message);
    const id = u.user!.id;
    if (data.role !== "student") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
      await supabaseAdmin.from("user_roles").insert({ user_id: id, role: data.role });
      if (data.role === "staff" && data.office_id) await supabaseAdmin.from("office_staff").insert({ user_id: id, office_id: data.office_id });
    }
    await supabaseAdmin.from("activity_logs").insert({ actor_id: context.userId, action: `Admin created ${data.role} account`, details: data.email });
    return { id };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), role: z.enum(["student", "staff", "admin"]), office_id: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId && data.role !== "admin") throw new Error("You cannot remove your own admin role");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    await supabaseAdmin.from("office_staff").delete().eq("user_id", data.user_id);
    if (data.role === "staff" && data.office_id) await supabaseAdmin.from("office_staff").insert({ user_id: data.user_id, office_id: data.office_id });
    await supabaseAdmin.from("activity_logs").insert({ actor_id: context.userId, action: `Admin changed role to ${data.role}`, office_id: data.office_id, details: data.user_id });
    return { ok: true };
  });

export const adminSetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.password });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("activity_logs").insert({ actor_id: context.userId, action: "Admin reset a user password", details: data.user_id });
    return { ok: true };
  });

export const adminDeleteDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: demo } = await supabaseAdmin.from("profiles").select("id").eq("is_demo", true).neq("id", context.userId);
    let n = 0;
    for (const p of demo ?? []) { const { error } = await supabaseAdmin.auth.admin.deleteUser(p.id); if (!error) n++; }
    await supabaseAdmin.from("activity_logs").insert({ actor_id: context.userId, action: "Admin deleted demo data", details: `${n} demo accounts removed` });
    return { removed: n };
  });
