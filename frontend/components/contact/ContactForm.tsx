"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { apiRequest, errorMessage } from "@/lib/api/client";

interface ContactFormProps {
  services: Array<{ id: string; title: string }>;
  automationConfigured: boolean;
}

interface ContactResult {
  inquiryId: string;
  stored: boolean;
  automationConfigured: boolean;
}

export function ContactForm({ services, automationConfigured }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContactResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError(null);

    try {
      const response = await apiRequest<ContactResult>("/api/contact", {
        json: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          serviceId: String(form.get("serviceId") ?? ""),
          message: String(form.get("message") ?? ""),
        },
      });
      setResult(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setStatus("idle");
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <Alert tone="success">
          Your inquiry was saved. Reference{" "}
          <strong>{result.inquiryId.slice(0, 8)}</strong>.
        </Alert>
        <p className="text-sm leading-6 text-muted">
          {result.automationConfigured
            ? "A notification workflow has been triggered for this inquiry."
            : "Email notifications are not connected in this environment, so nothing was emailed. The message is stored and visible in the admin console."}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setResult(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field id="contact-name" label="Name">
        <TextInput id="contact-name" name="name" autoComplete="name" required />
      </Field>

      <Field id="contact-email" label="Email">
        <TextInput
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>

      <Field id="contact-phone" label="Phone" hint="Optional">
        <TextInput id="contact-phone" name="phone" type="tel" autoComplete="tel" />
      </Field>

      {services.length > 0 ? (
        <Field id="contact-service" label="Service" hint="Optional">
          <SelectInput id="contact-service" name="serviceId" defaultValue="">
            <option value="">General inquiry</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}

      <Field id="contact-message" label="Message" hint="At least 10 characters">
        <TextArea id="contact-message" name="message" rows={5} required />
      </Field>

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </Button>

      <p className="text-xs leading-5 text-muted">
        {automationConfigured
          ? "Your message is stored and forwarded to the notification workflow."
          : "Your message is stored against a reference. Email delivery is not connected in this environment."}
      </p>
    </form>
  );
}
