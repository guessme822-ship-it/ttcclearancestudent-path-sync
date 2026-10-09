import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bell, Building2, ClipboardList, FileBarChart, GraduationCap, History, LayoutDashboard, Settings, UserCog } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { requireRole } from "@/lib/gate";
import { meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => requireRole(context.queryClient, "admin"),
  head: () => ({ meta: [{ title: "Administrator — TCC Clearance" }] }),
  component: Layout,
});

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/requests", label: "Clearance Requests", icon: ClipboardList },
  { to: "/admin/offices", label: "Offices", icon: Building2 },
  { to: "/admin/users", label: "Users", icon: UserCog },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
  { to: "/admin/logs", label: "Activity Logs", icon: History },
];

function Layout() {
  const me = useSuspenseQuery(meQuery).data as Me;
  return <AppShell me={me} nav={NAV} area="Administrator"><Outlet /></AppShell>;
}
