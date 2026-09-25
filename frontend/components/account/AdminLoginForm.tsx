"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { apiRequest, errorMessage } from "@/lib/api/client";
import { CONTACT_EMAIL } from "@/lib/constants";
import { safeInternalPath } from "@/lib/security/redirect";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("loading");
    setError(null);

    try {
      await apiRequest("/api/auth/admin-login", {
        json: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      router.replace(safeInternalPath(searchParams.get("next"), "/admin"));
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field id="email" label="Admin Gmail" hint="Required. Only the site-owner Gmail can open the admin dashboard.">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={CONTACT_EMAIL}
        />
      </Field>

      <Field id="password" label="Password" hint="Required.">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Signing in…" : "Open admin dashboard"}
      </Button>
    </form>
  );
}
