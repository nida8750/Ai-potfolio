import { HeroCharacter } from "@/components/hero/HeroCharacter";
import { ServicesIntro } from "@/components/services/ServiceCard";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { GlowCard } from "@/components/ui/GlowCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PERSON_NAME, ROLE, SITE_NAME, TAGLINE } from "@/lib/constants";

const focusAreas = [
  "AI Agents",
  "Automation",
  "RAG",
  "Voice AI",
  "Full-stack AI",
] as const;

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative overflow-hidden py-16 md:py-24 lg:py-28"
    >
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0">
          <ServicesIntro>
            <SectionHeading
              eyebrow="ABOUT"
              title={PERSON_NAME.toUpperCase()}
              titleId="about-heading"
              description={`${ROLE} building ${SITE_NAME} as a focused practice around agents, retrieval, automation, and voice.`}
            />
          </ServicesIntro>
          <p className="mt-6 max-w-xl text-sm leading-7 text-muted md:text-base">
            {TAGLINE} This portfolio shows how I structure multi-agent
            workflows, knowledge systems, connected automations, and voice
            interfaces as one stack — from reasoning and tools through to the
            product surface.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {focusAreas.map((area) => (
              <li key={area}>
                <Badge
                  variant={
                    area === "RAG" || area === "Voice AI" ? "blue" : "purple"
                  }
                >
                  {area}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <GlowCard className="mx-auto w-full max-w-md p-6">
          <HeroCharacter idPrefix="about-core" />
          <p className="mt-4 text-center text-sm text-muted">{ROLE}</p>
        </GlowCard>
      </Container>
    </section>
  );
}
