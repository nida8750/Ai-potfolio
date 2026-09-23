import "server-only";
import {
  type AutomationProductId,
  isAutomationProductId,
} from "@/data/automations";
import { env, isN8nConfigured } from "@/lib/env";
import { dispatchToN8n, type N8nDispatchResult, type N8nEventName } from "@/lib/n8n/client";

export { isAutomationProductId };
export type { AutomationProductId };

const PRODUCT_EVENT: Record<AutomationProductId, N8nEventName> = {
  leadflow: "inquiry.created",
  mailpilot: "admin.alert",
  invoiceflow: "order.created",
  supportsync: "customer.notification",
  contentflow: "content.requested",
};

export function productWebhookUrl(product: AutomationProductId): string | null {
  const exact = {
    leadflow: env.n8nWebhookLeadflow,
    mailpilot: env.n8nWebhookMailpilot,
    invoiceflow: env.n8nWebhookInvoiceflow,
    supportsync: env.n8nWebhookSupportsync,
    contentflow: env.n8nWebhookContentflow,
  }[product]?.replace(/\/+$/, "");
  if (exact) {
    return exact;
  }
  const base = env.n8nWebhookBaseUrl?.replace(/\/+$/, "");
  return base ? `${base}/nida-ai/${product}` : null;
}

export async function dispatchAutomationProduct(
  product: AutomationProductId,
  payload: Record<string, unknown>,
): Promise<N8nDispatchResult> {
  if (!isN8nConfigured()) {
    return { status: "skipped", reason: "not_configured" };
  }
  return dispatchToN8n(PRODUCT_EVENT[product], { product, ...payload });
}
