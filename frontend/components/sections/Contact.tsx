"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PERSON_NAME } from "@/lib/constants";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-background px-3 text-base text-foreground outline-none focus-visible:border-primary";

export function Contact() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

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
            description={`Share a workflow, knowledge problem, or product idea. ${PERSON_NAME} reviews new work through this page — message delivery will be connected in a later phase.`}
          />
        </div>
        <GlassCard className="p-6 md:p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
            aria-describedby="contact-form-note"
          >
            <div>
              <label
                htmlFor="contact-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                className={`${fieldClassName} h-11`}
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                className={`${fieldClassName} h-11`}
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="text-sm font-medium text-foreground"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                className={`${fieldClassName} resize-y py-3`}
              />
            </div>
            <Button type="submit" aria-describedby="contact-form-note">
              Send message
            </Button>
            <p id="contact-form-note" className="text-xs leading-5 text-muted">
              This form is a frontend layout only. Submitting it does not send
              email, store messages, or call an API.
            </p>
          </form>
        </GlassCard>
      </Container>
    </section>
  );
}
