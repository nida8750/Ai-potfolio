import { Mail, MapPin, Phone, Send } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { SocialLinks } from "@/components/contact/SocialLinks";
import { HeroCharacter } from "@/components/hero/HeroCharacter";
import { ServicesIntro } from "@/components/services/ServiceCard";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { loadPublicServices } from "@/lib/content/public-content";
import {
  CONTACT_EMAIL,
  CONTACT_LOCATION,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
} from "@/lib/constants";
import { isN8nConfigured } from "@/lib/env";

export async function Contact() {
  const { items: services } = await loadPublicServices();

  const details = [
    {
      icon: Mail,
      label: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
    },
    {
      icon: Phone,
      label: CONTACT_PHONE,
      href: `tel:${CONTACT_PHONE_HREF}`,
    },
    {
      icon: MapPin,
      label: CONTACT_LOCATION,
      href: undefined,
    },
  ];

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative overflow-hidden py-14 pb-28 md:py-20 md:pb-28 lg:py-24 lg:pb-28"
    >
      <Container className="relative">
        <ServicesIntro>
          <SectionHeading
            icon={<Send className="h-5 w-5" />}
            title="Get In Touch"
            titleId="contact-heading"
            description="Let's build something amazing together."
          />
        </ServicesIntro>

        <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.05fr)_minmax(0,0.7fr)] lg:items-start">
          <div className="min-w-0">
            <ul className="space-y-3">
              {details.map((detail) => (
                <li key={detail.label}>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface/60 px-4 py-3">
                    <detail.icon
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {detail.href ? (
                      <a
                        href={detail.href}
                        className="min-w-0 break-all text-sm text-foreground hover:text-accent"
                      >
                        {detail.label}
                      </a>
                    ) : (
                      <span className="min-w-0 break-words text-sm text-foreground">
                        {detail.label}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <SocialLinks />
          </div>

          <GlassCard className="p-5 md:p-6">
            <ContactForm
              services={services.map((service) => ({
                id: service.id,
                title: service.title,
              }))}
              automationConfigured={isN8nConfigured()}
            />
          </GlassCard>

          <div className="relative hidden lg:block">
            <HeroCharacter decorative className="max-w-[300px]" />
            <p className="mt-3 text-center font-display text-sm leading-7 text-muted">
              Dream · Build · Automate
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
