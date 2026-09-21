"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { apiRequest, errorMessage } from "@/lib/api/client";
import type { PaymentProviderName } from "@/types/order";

interface CheckoutButtonProps {
  orderId: string;
  providers: PaymentProviderName[];
}

export function CheckoutButton({ orderId, providers }: CheckoutButtonProps) {
  const [pending, setPending] = useState<PaymentProviderName | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(provider: PaymentProviderName) {
    setPending(provider);
    setError(null);

    try {
      const result = await apiRequest<{ redirectUrl: string }>(
        "/api/payments/checkout",
        { json: { orderId, provider } },
      );
      // Full navigation, not a router push: checkout is hosted by the provider.
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      setError(errorMessage(caught));
      setPending(null);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {providers.map((provider) => (
        <Button
          key={provider}
          className="w-full capitalize"
          disabled={pending !== null}
          onClick={() => startCheckout(provider)}
        >
          {pending === provider ? "Opening checkout…" : `Pay with ${provider}`}
        </Button>
      ))}
    </div>
  );
}
