import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { homeFor, meQuery, type Role } from "./session";

export async function requireRole(queryClient: QueryClient, role: Role) {
  const me = await queryClient.ensureQueryData(meQuery);
  if (!me) throw redirect({ to: "/auth" });
  if (!me.profile.is_active) {
    await supabase.auth.signOut();
    queryClient.clear();
    throw redirect({ to: "/auth", search: { inactive: 1 } });
  }
  if (me.role !== role) throw redirect({ to: homeFor(me.role) });
  return { me };
}
