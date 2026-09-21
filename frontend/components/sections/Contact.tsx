import { ContactForm } from "@/components/contact/ContactForm";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { loadPublicServices } from "@/lib/content/public-content";
import { PERSON_NAME } from "@/lib/constants";
import { isN8nConfigured } from "@/lib/env";

export async function Contact() {
  const { items: services } = await loadPublicServices();

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative overflow-hidden py-16 md:py-24 lg:py-28"
    >
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="min-w-0">
          <SectionHeading
            eyebrow="CONTACT"
            title="LET'S BUILD WITH AI"
            titleId="contact-heading"
            description={`Share a workflow, knowledge problem, or product idea. ${PERSON_NAME} reviews every inquiry sent through this form.`}
          />
          <p className="mt-6 max-w-md text-sm leading-6 text-muted">
            Your message is stored against a reference you can quote later. If
            you have an account, the inquiry is attached to it so you can follow
            its status from your dashboard.
          </p>
        </div>

        <GlassCard className="p-6 md:p-8">
          <ContactForm
            services={services.map((service) => ({
              id: service.id,
              title: service.title,
            }))}
            automationConfigured={isN8nConfigured()}
          />
        </GlassCard>
      </Container>
    </section>
  );
}
