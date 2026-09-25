"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { VerifyEmailForm } from "@/components/account/VerifyEmailForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { apiRequest, errorCode, errorMessage } from "@/lib/api/client";
import { writePendingVerify } from "@/lib/auth/pending-verify";
import { postLoginPath } from "@/lib/security/redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "verify">("idle");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "");
    setStatus("loading");
    setError(null);

    try {
      const result = await apiRequest<{ user: { role: "USER" | "ADMIN" } }>(
        "/api/auth/login",
        {
          json: {
            email: submittedEmail,
            password: String(form.get("password") ?? ""),
          },
        },
      );
      router.replace(postLoginPath(result.user.role, searchParams.get("next")));
      router.refresh();
    } catch (caught) {
      if (errorCode(caught) === "UNVERIFIED") {
        setEmail(submittedEmail);
        try {
          await apiRequest("/api/auth/resend-verification", {
            json: { email: submittedEmail },
          });
          writePendingVerify(submittedEmail);
        } catch {
          writePendingVerify(submittedEmail);
        }
        setStatus("verify");
        return;
      }
      setError(errorMessage(caught));
      setStatus("idle");
    }
  }

  if (status === "verify") {
    return (
      <VerifyEmailForm
        email={email}
        notice={`Verify ${email} before signing in. A 6-digit code was just emailed.`}
        onVerified={() => {
          router.replace("/login?verified=1");
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field id="email" label="Email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={error ? "email-error" : undefined}
        />
      </Field>

      <Field id="password" label="Password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
