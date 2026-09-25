"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { apiRequest, errorMessage } from "@/lib/api/client";
import { writePendingVerify } from "@/lib/auth/pending-verify";
import { CONTACT_EMAIL } from "@/lib/constants";

interface VerifyEmailFormProps {
  email: string;
  notice?: string;
  onVerified: () => void | Promise<void>;
}

export function VerifyEmailForm({
  email,
  notice,
  onVerified,
}: VerifyEmailFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(notice ?? null);
  const [sending, setSending] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    try {
      await apiRequest("/api/auth/verify", {
        json: { email, code: String(form.get("code") ?? "") },
      });
      await onVerified();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleResend() {
    setSending(true);
    setError(null);
    try {
      await apiRequest("/api/auth/resend-verification", {
        json: { email },
      });
      writePendingVerify(email);
      setInfo(`A new verification code was emailed to ${email}.`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Alert tone="info">
        {info ??
          `A 6-digit verification code was emailed to ${email} from ${CONTACT_EMAIL}. Enter that code here.`}
      </Alert>

      <Field id="code" label="Verification code">
        <TextInput
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
      </Field>

      <Button type="submit" className="w-full">
        Verify email
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={sending}
        onClick={handleResend}
      >
        {sending ? "Sending…" : "Resend verification code"}
      </Button>
    </form>
  );
}
