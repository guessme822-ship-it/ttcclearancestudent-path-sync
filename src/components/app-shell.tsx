import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotificationBell } from "@/components/notifications";
import { InstallPrompt } from "@/components/pwa";
import { DemoBadge } from "@/components/states";
import { fullName, type Me } from "@/lib/session";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean; mobile?: boolean };

export function AppShell({ me, nav, children, area }: { me: Me; nav: NavItem[]; children: ReactNode; area: string }) {
  const [open, setOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (n: NavItem) => (n.exact ? path === n.to : path === n.to || path.startsWith(n.to + "/"));
  const bottom = nav.filter((n) => n.mobile);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(n) ? "bg-primary text-primary-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <n.icon className="h-[18px] w-[18px]" /> {n.label}
        </Link>
      ))}
      <button onClick={() => setConfirmOut(true)} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft">
        <LogOut className="h-[18px] w-[18px]" /> Logout
      </button>
    </nav>
  );

  const brand = (
    <Link to="/" className="flex items-center gap-2.5 px-1">
      <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
      <div className="leading-tight">
        <p className="font-display text-sm font-bold">TCC Clearance</p>
        <p className="text-[11px] text-muted-foreground">{area}</p>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar p-4 lg:flex">
        {brand}
        <div className="mt-6 flex-1 overflow-y-auto">{links}</div>
        <div className="rounded-xl border bg-card p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold">{fullName(me.profile)} {me.profile.is_demo && <DemoBadge />}</p>
          <p className="truncate text-muted-foreground">{me.email}</p>
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {brand}
          <div className="mt-6">{links}</div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="glass no-print sticky top-0 z-20 border-b">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
            <button aria-label="Open menu" className="rounded-xl p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">{brand}</div>
            <div className="ml-auto flex items-center gap-2">
              {me.officeName && <span className="hidden rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground sm:inline">{me.officeName}</span>}
              <NotificationBell userId={me.id} base={nav[0].to} />
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-primary-foreground sm:flex" aria-hidden>
                {(me.profile.first_name[0] ?? "") + (me.profile.last_name[0] ?? "")}
              </div>
            </div>
          </div>
        </header>
        <main className={cn("mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8", bottom.length && "pb-24 lg:pb-8")}>{children}</main>
      </div>

      {bottom.length > 0 && (
        <nav className="glass no-print fixed inset-x-0 bottom-0 z-30 grid border-t pb-[env(safe-area-inset-bottom)] lg:hidden" style={{ gridTemplateColumns: `repeat(${bottom.length}, 1fr)` }} aria-label="Quick">
          {bottom.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", isActive(n) ? "text-primary" : "text-muted-foreground")}>
              <n.icon className="h-5 w-5" /> {n.label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      )}
      <InstallPrompt />

      <AlertDialog open={confirmOut} onOpenChange={setConfirmOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>You'll need to sign in again to access your clearance.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={signOut}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
