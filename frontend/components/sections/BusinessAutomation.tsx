import { Workflow } from "lucide-react";
import { AutomationCard } from "@/components/automation/AutomationCard";
import { Container } from "@/components/ui/Container";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { GridBackground } from "@/components/ui/GridBackground";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { businessAutomations } from "@/data/automations";

export function BusinessAutomation() {
  return (
    <section
      id="automation"
      aria-labelledby="automation-heading"
      className="relative overflow-hidden py-14 md:py-20 lg:py-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <GridBackground />
        <GlowOrb color="purple" className="-left-20 top-10 h-56 w-56 opacity-40" />
        <GlowOrb color="blue" className="-right-16 bottom-0 h-48 w-48 opacity-45" />
      </div>

      <Container className="relative">
        <SectionHeading
          icon={<Workflow className="h-5 w-5" />}
          title="Business Automation"
          titleId="automation-heading"
          description="Nida AI Automation Suite — LeadFlow, MailPilot, InvoiceFlow, SupportSync, and ContentFlow. Each card is an n8n webhook template. Workflows stay inactive until you test them."
        />

        <ul className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {businessAutomations.map((automation, index) => (
            <li key={automation.id} className="min-w-0">
              <AutomationCard automation={automation} index={index} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
