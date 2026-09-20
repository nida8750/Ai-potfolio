import { ServiceCard } from "@/components/services/ServiceCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/data/services";

export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative py-16 md:py-24"
    >
      <Container>
        <SectionHeading
          eyebrow="Services"
          title="AI SYSTEMS BUILT TO AUTOMATE"
          titleId="services-heading"
          description="Focused systems for agents, retrieval, automation, and voice — designed as products, not demos."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <li key={service.title}>
              <ServiceCard
                service={service}
                id={service.icon === "agents" ? "agents" : undefined}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
