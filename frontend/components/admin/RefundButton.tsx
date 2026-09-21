"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest, errorMessage } from "@/lib/api/client";

export function RefundButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refund() {
    setPending(true);
    setError(null);

    try {
      await apiRequest(`/api/admin/payments/${paymentId}/refund`, { method: "POST" });
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  if (error) {
    return <span className="text-xs text-red-300">{error}</span>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="text-sm text-muted hover:text-foreground"
        onClick={() => setConfirming(true)}
      >
        Refund
      </button>
    );
  }

  return (
    <span className="flex justify-end gap-3">
      <button
        type="button"
        className="text-sm text-amber-300 hover:text-amber-200"
        onClick={refund}
        disabled={pending}
      >
        {pending ? "Refunding…" : "Confirm"}
      </button>
      <button
        type="button"
        className="text-sm text-muted hover:text-foreground"
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </span>
  );
}
