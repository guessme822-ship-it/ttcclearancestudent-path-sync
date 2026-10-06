import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  pendingComponent: AppLoading,
  component: () => <Outlet />,
});

export function AppLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <img src="/icon.svg" alt="" className="h-14 w-14 animate-pulse rounded-2xl" />
      <p className="text-sm text-muted-foreground">Loading TCC Clearance…</p>
    </div>
  );
}
