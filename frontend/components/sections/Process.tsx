import {
  ArrowRight,
  Code2,
  MessageSquare,
  Rocket,
  Route,
  ShieldCheck,
} from "lucide-react";
import { ServicesIntro } from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GlowCard } from "@/components/ui/GlowCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROCESS_STEPS } from "@/lib/constants";

const stepIcons = {
  chat: MessageSquare,
  build: Code2,
  review: ShieldCheck,
  grow: Rocket,
} as const;

export function Process() {
  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="relative overflow-hidden py-14 md:py-20 lg:py-24"
    >
      <Container className="relative">
        <ServicesIntro>
          <SectionHeading
            icon={<Route className="h-5 w-5" />}
            title="How It Works"
            titleId="process-heading"
            description="Simple steps to turn your ideas into intelligent systems."
          />
        </ServicesIntro>

        <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.45fr)] lg:items-stretch">
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PROCESS_STEPS.map((step, index) => {
              const Icon = stepIcons[step.icon];
              const isLast = index === PROCESS_STEPS.length - 1;

              return (
                <li key={step.step} className="relative min-w-0">
                  <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface/60 p-5">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-gradient-to-br from-primary/25 to-accent/10 text-primary"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-accent">
                      {step.step}
                    </p>
                    <h3 className="mt-1.5 font-display text-base text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-6 text-muted">
                      {step.description}
                    </p>
                  </div>

                  {isLast ? null : (
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary/50 xl:block"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          <GlowCard className="flex flex-col justify-center p-6">
            <h3 className="font-display text-lg text-foreground">
              Start Your AI Journey
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Have an idea or need help? Tell me what you want to automate and
              I will map out how to build it.
            </p>
            <Button
              href="#contact"
              className="mt-5 w-full"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Contact Me
            </Button>
          </GlowCard>
        </div>
      </Container>
    </section>
  );
}
