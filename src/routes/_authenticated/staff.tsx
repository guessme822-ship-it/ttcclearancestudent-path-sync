import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bell, LayoutDashboard, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { requireRole } from "@/lib/gate";
import { meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/staff")({
  beforeLoad: ({ context }) => requireRole(context.queryClient, "staff"),
  head: () => ({ meta: [{ title: "Office Staff — TCC Clearance" }] }),
  component: Layout,
});

const NAV: NavItem[] = [
  { to: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { to: "/staff/notifications", label: "Notifications", icon: Bell },
  { to: "/staff/profile", label: "Profile", icon: User },
];

function Layout() {
  const me = useSuspenseQuery(meQuery).data as Me;
  return <AppShell me={me} nav={NAV} area={me.officeName ? `${me.officeName} Office` : "Office Staff"}><Outlet /></AppShell>;
}
