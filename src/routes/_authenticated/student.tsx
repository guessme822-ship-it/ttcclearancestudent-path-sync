import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bell, ClipboardList, HelpCircle, LayoutDashboard, ListChecks, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { requireRole } from "@/lib/gate";
import { meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/student")({
  beforeLoad: ({ context }) => requireRole(context.queryClient, "student"),
  head: () => ({ meta: [{ title: "Student — TCC Clearance" }] }),
  component: Layout,
});

const NAV: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true, mobile: true },
  { to: "/student/clearance", label: "My Clearance", icon: ClipboardList, mobile: true },
  { to: "/student/status", label: "Clearance Status", icon: ListChecks, mobile: true },
  { to: "/student/notifications", label: "Notifications", icon: Bell, mobile: true },
  { to: "/student/profile", label: "Profile", icon: User, mobile: true },
  { to: "/student/help", label: "Help / Support", icon: HelpCircle },
];

function Layout() {
  const { data: me } = useSuspenseQuery(meQuery);
  return (
    <AppShell me={me as Me} nav={NAV} area="Student Portal">
      <Outlet />
    </AppShell>
  );
}
