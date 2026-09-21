import "server-only";
import { createHmac } from "node:crypto";
import { env, isN8nConfigured } from "@/lib/env";
import { logEvent } from "@/lib/security/logger";

export type N8nEventName =
  | "inquiry.created"
  | "order.created"
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded"
  | "order.status_changed"
  | "admin.alert"
  | "customer.notification"
  | "followup.scheduled";

export type N8nDispatchResult =
  | { status: "skipped"; reason: "not_configured" }
  | { status: "sent"; httpStatus: number }
  | { status: "failed"; reason: string };

const TIMEOUT_MS = 4000;

function webhookUrl(event: N8nEventName): string {
  const base = env.n8nWebhookBaseUrl?.replace(/\/+$/, "") ?? "";
  return `${base}/${event.replace(/\./g, "-")}`;
}

function sign(body: string, timestamp: string): string {
  return createHmac("sha256", env.n8nWebhookSecret ?? "")
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

/**
 * Best-effort automation dispatch. Callers persist their data first: a failed
 * or unconfigured n8n webhook must never roll back a database write.
 */
export async function dispatchToN8n(
  event: N8nEventName,
  payload: Record<string, unknown>,
): Promise<N8nDispatchResult> {
  if (!isN8nConfigured()) {
    return { status: "skipped", reason: "not_configured" };
  }

  const timestamp = Date.now().toString();
  const body = JSON.stringify({ event, sentAt: new Date().toISOString(), data: payload });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl(event), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nida-event": event,
        "x-nida-timestamp": timestamp,
        "x-nida-signature": sign(body, timestamp),
      },
      body,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      logEvent({
        action: "n8n.dispatch",
        result: "error",
        errorCategory: "upstream_status",
        metadata: { event, httpStatus: response.status },
      });
      return { status: "failed", reason: `http_${response.status}` };
    }

    logEvent({ action: "n8n.dispatch", result: "ok", metadata: { event } });
    return { status: "sent", httpStatus: response.status };
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown";
    logEvent({
      action: "n8n.dispatch",
      result: "error",
      errorCategory: reason,
      metadata: { event },
    });
    return { status: "failed", reason };
  } finally {
    clearTimeout(timer);
  }
}

export function verifyN8nCallback(
  body: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  if (!isN8nConfigured() || !timestamp || !signature) {
    return false;
  }
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > 5 * 60 * 1000) {
    return false;
  }
  const expected = sign(body, timestamp);
  return expected.length === signature.length && expected === signature;
}
