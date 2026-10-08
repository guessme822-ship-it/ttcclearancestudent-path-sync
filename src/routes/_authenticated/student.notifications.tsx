import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { NotificationsPage } from "@/components/notifications";
import { meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/student/notifications")({ component: P });
function P() {
  const me = useSuspenseQuery(meQuery).data as Me;
  return <NotificationsPage userId={me.id} />;
}
