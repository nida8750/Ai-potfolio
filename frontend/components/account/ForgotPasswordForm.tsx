"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { apiRequest, errorMessage } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submitted = String(form.get("email") ?? "");
    setStatus("loading");
    setError(null);

    try {
      const result = await apiRequest<{ accepted: boolean; resetCode?: string }>(
        "/api/auth/forgot-password",
        { json: { email: submitted } },
      );
      setEmail(submitted);
      setDevCode(result.resetCode ?? null);
      setStatus("sent");
    } catch (caught) {
      setError(errorMessage(caught));
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-6 space-y-4">
        {devCode ? (
          <Alert tone="warning">
            Email delivery is not connected in this environment, so the reset
            code is shown here instead of being sent: <strong>{devCode}</strong>
          </Alert>
        ) : (
          <Alert tone="info">
            If an account exists for {email}, a reset code has been issued.
          </Alert>
        )}
        <Button
          className="w-full"
          onClick={() =>
            router.push(`/reset-password?email=${encodeURIComponent(email)}`)
          }
        >
          Continue to reset
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field id="email" label="Email">
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send reset code"}
      </Button>
    </form>
  );
}
