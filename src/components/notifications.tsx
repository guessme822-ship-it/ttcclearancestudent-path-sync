import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Bell, BellOff, CheckCheck, CheckCircle2, Info, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/states";
import { cn } from "@/lib/utils";

type N = { id: string; title: string; body: string | null; link: string | null; kind: string; is_read: boolean; created_at: string };

export function useNotifications(userId: string, limit = 50) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data as N[];
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel(`notif-${userId}-${limit}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications", userId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, limit, qc]);
  return q;
}

function useNotifActions(userId: string) {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["notifications", userId] });
  const markRead = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id); if (error) throw error; },
    onSuccess: inv,
  });
  const markAll = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false); if (error) throw error; },
    onSuccess: () => { inv(); toast.success("All notifications marked as read"); },
    onError: () => toast.error("Could not update notifications"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("notifications").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { inv(); toast.success("Notification removed"); },
  });
  return { markRead, markAll, remove };
}

function KindIcon({ kind }: { kind: string }) {
  if (kind === "success") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (kind === "error") return <XCircle className="h-4 w-4 text-danger" />;
  return <Info className="h-4 w-4 text-primary" />;
}

export function NotificationBell({ userId, base }: { userId: string; base: string }) {
  const q = useNotifications(userId, 8);
  const all = useNotifications(userId, 50);
  const { markRead, markAll } = useNotifActions(userId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = (all.data ?? []).filter((n) => !n.is_read).length;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative rounded-xl p-2 hover:bg-muted">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          {unread > 0 && <button className="text-xs font-medium text-primary hover:underline" onClick={() => markAll.mutate()}>Mark all read</button>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {q.isLoading ? <ListSkeleton rows={3} className="p-3" /> : (q.data ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications.</p>
          ) : (
            q.data!.map((n) => (
              <button key={n.id} onClick={() => { if (!n.is_read) markRead.mutate(n.id); setOpen(false); if (n.link) navigate({ to: n.link }); }}
                className={cn("flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted", !n.is_read && "bg-accent/50")}>
                <KindIcon kind={n.kind} />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                  {n.body && <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
                {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </button>
            ))
          )}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full" onClick={() => setOpen(false)}><Link to={`${base}/notifications`}>View all notifications</Link></Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationsPage({ userId }: { userId: string }) {
  const q = useNotifications(userId, 50);
  const { markRead, markAll, remove } = useNotifActions(userId);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const list = (q.data ?? []).filter((n) => filter === "all" || !n.is_read);
  return (
    <div>
      <PageHeader title="Notifications" description="Updates about clearance requests and approvals."
        actions={<Button variant="outline" onClick={() => markAll.mutate()} disabled={!q.data?.some((n) => !n.is_read)}><CheckCheck className="mr-1 h-4 w-4" /> Mark all as read</Button>} />
      <div className="mb-4 inline-flex rounded-xl border bg-card p-1">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium capitalize", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{f}</button>
        ))}
      </div>
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState message="Unable to load notifications." onRetry={() => q.refetch()} /> : list.length === 0 ? (
        <EmptyState icon={<BellOff className="h-6 w-6" />} title="No notifications" description={filter === "unread" ? "You're all caught up." : "You'll see updates here when something happens."} />
      ) : (
        <ul className="space-y-2">
          {list.map((n) => (
            <li key={n.id} className={cn("flex gap-3 rounded-2xl border bg-card p-4 shadow-soft", !n.is_read && "border-primary/30 bg-accent/40")}>
              <div className="mt-0.5"><KindIcon kind={n.kind} /></div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d, yyyy · h:mm a")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {n.link && <Button size="sm" variant="outline" onClick={() => { if (!n.is_read) markRead.mutate(n.id); navigate({ to: n.link! }); }}>Open</Button>}
                  {!n.is_read && <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>Mark as read</Button>}
                </div>
              </div>
              <button aria-label="Delete notification" onClick={() => remove.mutate(n.id)} className="h-fit rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
