"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { apiRequest, errorMessage } from "@/lib/api/client";

/**
 * Rendered only when a payer returns from PayPal on an order that is not
 * settled yet. It asks the server to capture once; the guard prevents a
 * second attempt if React re-runs the effect.
 */
export function CaptureOnReturn({ orderId }: { orderId: string }) {
  const router = useRouter();
  const attempted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attempted.current) {
      return;
    }
    attempted.current = true;

    apiRequest<{ status: string }>("/api/payments/capture", { json: { orderId } })
      .then(() => router.refresh())
      .catch((caught) => setError(errorMessage(caught)));
  }, [orderId, router]);

  if (error) {
    return <Alert tone="error">{error}</Alert>;
  }

  return <Alert tone="info">Confirming your payment with PayPal…</Alert>;
}
