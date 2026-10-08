import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { RequestView } from "./student.status";

export const Route = createFileRoute("/_authenticated/student/history/$id")({ component: H });

function H() {
  const { id } = Route.useParams();
  return (
    <div>
      <Link to="/student/clearance" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to history</Link>
      <RequestView id={id} title="Clearance details" />
    </div>
  );
}
