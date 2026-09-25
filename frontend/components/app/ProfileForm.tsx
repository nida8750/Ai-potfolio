"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { apiRequest, errorMessage } from "@/lib/api/client";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("saving");
    setError(null);

    try {
      await apiRequest("/api/profile", {
        method: "PATCH",
        json: {
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
        },
      });
      setStatus("saved");
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {status === "saved" ? <Alert tone="success">Profile updated.</Alert> : null}

      <Field id="profile-name" label="Name">
        <TextInput
          id="profile-name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          required
        />
      </Field>

      <Field id="profile-phone" label="Phone" hint="Optional">
        <PhoneInput id="profile-phone" defaultValue={phone} />
      </Field>

      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
