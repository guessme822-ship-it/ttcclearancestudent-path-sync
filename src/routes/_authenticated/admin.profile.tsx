import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ProfileForm } from "@/components/profile-form";
import { meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin/profile")({ component: P });
function P() {
  const me = useSuspenseQuery(meQuery).data as Me;
  return <ProfileForm me={me} />;
}
