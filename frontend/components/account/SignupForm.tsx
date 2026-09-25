"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { VerifyEmailForm } from "@/components/account/VerifyEmailForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { apiRequest, errorMessage } from "@/lib/api/client";
import {
  clearPendingVerify,
  readPendingVerify,
  writePendingVerify,
} from "@/lib/auth/pending-verify";

interface SignupResult {
  confirmationRequired: boolean;
}

export function SignupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "verify">("idle");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const pending = readPendingVerify();
    if (!pending) {
      return;
    }
    setEmail(pending.email);
    setStatus("verify");
  }, []);

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
      if (!result.confirmationRequired) {
        clearPendingVerify();
        router.replace("/login?verified=1");
        return;
      }
      writePendingVerify(submittedEmail);
      setStatus("verify");
    } catch (caught) {
      setError(errorMessage(caught));
      setStatus("idle");
    }
  }

  if (status === "verify") {
    return (
      <VerifyEmailForm
        email={email}
        onVerified={() => {
          clearPendingVerify();
          router.replace("/login?verified=1");
        }}
      />
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
        <PhoneInput id="phone" />
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
