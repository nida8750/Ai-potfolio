"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { apiRequest, errorMessage } from "@/lib/api/client";

interface SignupResult {
  confirmationRequired: boolean;
  verificationCode?: string;
}

export function SignupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "verify">("idle");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "");
    setStatus("loading");
    setError(null);

    try {
      const result = await apiRequest<SignupResult>("/api/auth/signup", {
        json: {
          name: String(form.get("name") ?? ""),
          email: submittedEmail,
          password: String(form.get("password") ?? ""),
          phone: String(form.get("phone") ?? ""),
        },
      });
      setEmail(submittedEmail);
      setDevCode(result.verificationCode ?? null);
      setStatus("verify");
    } catch (caught) {
      setError(errorMessage(caught));
      setStatus("idle");
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    try {
      await apiRequest("/api/auth/verify", {
        json: { email, code: String(form.get("code") ?? "") },
      });
      router.replace("/login?verified=1");
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  if (status === "verify") {
    return (
      <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}

        {devCode ? (
          <Alert tone="warning">
            Email delivery is not connected in this environment, so the code is
            shown here instead of being sent: <strong>{devCode}</strong>
          </Alert>
        ) : (
          <Alert tone="info">
            Enter the verification code that was sent to {email}.
          </Alert>
        )}

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
      </form>
    );
  }

  return (
    <form onSubmit={handleSignup} className="mt-6 space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field id="name" label="Name">
        <TextInput id="name" name="name" autoComplete="name" required />
      </Field>

      <Field id="email" label="Email">
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field id="phone" label="Phone" hint="Optional">
        <TextInput id="phone" name="phone" type="tel" autoComplete="tel" />
      </Field>

      <Field id="password" label="Password" hint="At least 8 characters with a letter and a number">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
