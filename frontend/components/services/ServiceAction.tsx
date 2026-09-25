"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, apiRequest, errorMessage } from "@/lib/api/client";
import type { Order } from "@/types/order";

interface ServiceActionProps {
  serviceId: string;
  title: string;
  purchasable: boolean;
  signedIn?: boolean;
}

const SERVICE_LOGIN_HREF = `/login?next=${encodeURIComponent("/#contact")}`;

export function ServiceAction({
  serviceId,
  title,
  purchasable,
  signedIn = false,
}: ServiceActionProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!purchasable) {
    return (
      <Button
        href={signedIn ? "#contact" : SERVICE_LOGIN_HREF}
        variant="secondary"
        size="sm"
        className="mt-4 w-full"
        aria-label={`Request a quote for ${title}`}
      >
        Request a quote
      </Button>
    );
  }

  async function order() {
    if (!signedIn) {
      router.push(SERVICE_LOGIN_HREF);
      return;
    }

    setPending(true);
    setError(null);

    try {
      // The server derives the amount from the stored service price.
      await apiRequest<{ order: Order }>("/api/orders", {
        json: { serviceId },
      });
      router.push("/#contact");
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.status === 401) {
        router.push(SERVICE_LOGIN_HREF);
        return;
      }
      setError(errorMessage(caught));
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <Button
        size="sm"
        className="w-full"
        onClick={order}
        disabled={pending}
        aria-label={`Order ${title}`}
      >
        {pending ? "Creating order…" : "Order this service"}
      </Button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
