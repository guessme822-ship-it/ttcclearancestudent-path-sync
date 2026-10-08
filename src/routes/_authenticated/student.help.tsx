import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, PageHeader } from "@/components/states";

export const Route = createFileRoute("/_authenticated/student/help")({ component: Help });

const FAQ = [
  ["How do I request clearance?", "Go to My Clearance, press Start request, review your information, confirm, and submit. Every required office is notified at once."],
  ["What do the colors mean?", "Yellow = pending review, green = approved, red = rejected (action needed), gray = not started."],
  ["An office rejected my clearance. What now?", "Open Clearance Status. The red card shows the reason. Settle the concern with that office, then press Resubmit on that card."],
  ["How do I get my clearance confirmation?", "When all offices approve, your status becomes COMPLETED and a Print confirmation button appears. You can print it or save it as PDF."],
  ["My Student ID, program, or year level is wrong.", "These are locked for security. Please visit the Registrar to have them corrected."],
  ["Can I use the app offline?", "You can open the app, but submitting requests and seeing new approvals needs an internet connection."],
];

function Help() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help & Support" description="Answers to common clearance questions." />
      <Card>
        <Accordion type="single" collapsible>
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </Card>
      <Card title="Contact the school">
        <ul className="space-y-3 text-sm">
          <li className="flex gap-2"><MapPin className="h-4 w-4 text-primary" /> Purok-2B, Sayre Highway, Pandalatan, Maramag, Bukidnon 8714</li>
          <li className="flex gap-2"><Mail className="h-4 w-4 text-primary" /> Visit the Registrar's Office for record corrections</li>
          <li className="flex gap-2"><Phone className="h-4 w-4 text-primary" /> Office hours: Monday–Friday, 8:00 AM – 5:00 PM</li>
        </ul>
      </Card>
    </div>
  );
}
