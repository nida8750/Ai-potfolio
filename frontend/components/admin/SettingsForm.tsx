"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, SelectInput } from "@/components/ui/Field";
import { apiRequest, errorMessage } from "@/lib/api/client";
import type { PaymentProviderName } from "@/types/order";
import type { PlatformSettings } from "@/types/settings";

interface SettingsFormProps {
  settings: PlatformSettings;
  currencies: string[];
  configuredProviders: PaymentProviderName[];
}

export function SettingsForm({
  settings,
  currencies,
  configuredProviders,
}: SettingsFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("saving");
    setError(null);

    try {
      await apiRequest("/api/admin/settings", {
        method: "PUT",
        json: {
          defaultCurrency: String(form.get("defaultCurrency") ?? ""),
          paymentProvider: String(form.get("paymentProvider") ?? "none"),
          bookingsEnabled: form.get("bookingsEnabled") === "on",
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {status === "saved" ? <Alert tone="success">Settings saved.</Alert> : null}

      <Field id="set-currency" label="Default currency">
        <SelectInput
          id="set-currency"
          name="defaultCurrency"
          defaultValue={settings.defaultCurrency}
        >
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field
        id="set-provider"
        label="Payment provider"
        hint={
          configuredProviders.length === 0
            ? "No provider credentials are present, so only None can be selected."
            : `Configured: ${configuredProviders.join(", ")}`
        }
      >
        <SelectInput
          id="set-provider"
          name="paymentProvider"
          defaultValue={settings.paymentProvider}
        >
          <option value="none">None</option>
          {configuredProviders.map((provider) => (
            <option key={provider} value={provider} className="capitalize">
              {provider}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Checkbox
        id="set-bookings"
        name="bookingsEnabled"
        label="Accept new service requests"
        defaultChecked={settings.bookingsEnabled}
      />

      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
