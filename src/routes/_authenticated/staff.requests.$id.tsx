import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ReviewPage } from "@/components/review";
import { meQuery, type Me } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/staff/requests/$id")({ component: P });
function P() {
  const { id } = Route.useParams();
  const me = useSuspenseQuery(meQuery).data as Me;
  return (
    <div>
      <Link to="/staff" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to requests</Link>
      <ReviewPage id={id} me={me} />
    </div>
  );
}
