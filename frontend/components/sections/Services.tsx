import { ServiceCard, ServicesIntro } from "@/components/services/ServiceCard";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { GridBackground } from "@/components/ui/GridBackground";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { loadPublicServices } from "@/lib/content/public-content";

export async function Services() {
  const { items: services } = await loadPublicServices();
  const agentsService = services.find((service) => service.icon === "agents");

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative overflow-hidden py-16 md:py-24 lg:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <GridBackground />
        <GlowOrb color="blue" className="-right-16 bottom-0 h-52 w-52 opacity-50" />
      </div>
      <Container className="relative">
        <ServicesIntro>
          <SectionHeading
            eyebrow="WHAT I BUILD"
            title="AI SYSTEMS BUILT TO AUTOMATE"
            titleId="services-heading"
            description="Intelligent systems designed to connect AI models, agents, knowledge, workflows, and business processes."
          />
        </ServicesIntro>

        {services.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No services published yet"
              description="Services appear here as soon as they are activated in the admin console."
            />
          </div>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => (
              <li
                key={service.id}
                // The Agents nav link targets the AI Agents card rather than a
                // section that does not exist.
                id={service.id === agentsService?.id ? "agents" : undefined}
                className="min-w-0"
              >
                <ServiceCard service={service} index={index} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
