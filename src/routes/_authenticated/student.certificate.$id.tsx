import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, ListSkeleton } from "@/components/states";
import { requestDetailQuery } from "@/lib/clearance";

export const Route = createFileRoute("/_authenticated/student/certificate/$id")({ component: Cert });

function Cert() {
  const { id } = Route.useParams();
  const q = useQuery(requestDetailQuery(id));
  if (q.isLoading) return <ListSkeleton />;
  const r = q.data;
  if (!r) return <ErrorState message="Clearance not found." />;
  if (r.status !== "completed") return <ErrorState message="A confirmation is only available once all offices have approved." />;
  return (
    <div>
      <div className="no-print mb-4 flex justify-between">
        <Link to="/student/status" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <Button onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print / Save as PDF</Button>
      </div>
      <article className="print-area mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-soft sm:p-12">
        <header className="flex items-center gap-4 border-b pb-6">
          <img src="/icon.svg" alt="" className="h-16 w-16 rounded-xl" />
          <div>
            <h1 className="text-xl font-extrabold">TORRES CAPITOL COLLEGE, INC.</h1>
            <p className="text-xs text-muted-foreground">Purok-2B, Sayre Highway, Pandalatan, Maramag, Bukidnon 8714, Philippines</p>
          </div>
        </header>
        <h2 className="mt-8 text-center text-2xl font-extrabold tracking-wide">STUDENT CLEARANCE CONFIRMATION</h2>
        <p className="mt-1 text-center font-mono text-sm">Ref. No. {r.reference_no}</p>
        <p className="mt-8 leading-relaxed">This certifies that <b>{r.profile?.first_name} {r.profile?.middle_name ?? ""} {r.profile?.last_name}</b> (Student ID <b>{r.student?.student_number}</b>), enrolled in <b>{r.student?.program}</b>, Year {r.student?.year_level}{r.student?.section ? `, Section ${r.student.section}` : ""}, has been cleared by all required offices for the <b>{r.semester}, School Year {r.school_year}</b>.</p>
        <table className="mt-8 w-full text-sm">
          <thead><tr className="border-b text-left"><th className="py-2">Office</th><th>Approved by</th><th>Date</th></tr></thead>
          <tbody>{r.items.map((i) => (
            <tr key={i.id} className="border-b"><td className="py-2 font-medium">{i.offices?.name}</td><td>{i.reviewer ? `${i.reviewer.first_name} ${i.reviewer.last_name}` : "—"}</td><td>{i.reviewed_at ? format(new Date(i.reviewed_at), "MMM d, yyyy") : "—"}</td></tr>
          ))}</tbody>
        </table>
        <p className="mt-8 text-sm">Date completed: <b>{r.completed_at && format(new Date(r.completed_at), "MMMM d, yyyy h:mm a")}</b></p>
        <p className="mt-10 text-xs text-muted-foreground">System-generated confirmation. Verify with the Registrar using the reference number above.</p>
      </article>
    </div>
  );
}
