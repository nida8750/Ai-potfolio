import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/server";
import { PaymentConfigurationError } from "@/lib/payments/types";
import {
  assertSameOrigin,
  clientIp,
  jsonError,
  requestIdFrom,
} from "@/lib/security/http";
import { logEvent } from "@/lib/security/logger";
import { limitKey, rateLimit } from "@/lib/security/rate-limit";
import type { z } from "zod";

export interface RouteOptions {
  action: string;
  rateLimit?: { limit: number; windowMs: number };
  /** Skip the same-origin check for endpoints called by external systems. */
  allowCrossOrigin?: boolean;
}

export interface RouteContext {
  requestId: string;
  ip: string;
}

function messageFor(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the submitted values.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * Wraps a route body with origin checks, rate limiting, structured logging,
 * and error shaping. Internal error details are logged, never returned.
 */
export async function handleRoute(
  request: Request,
  options: RouteOptions,
  handler: (context: RouteContext) => Promise<Response>,
): Promise<Response> {
  const requestId = requestIdFrom(request);
  const ip = clientIp(request);

  if (!options.allowCrossOrigin && !assertSameOrigin(request)) {
    logEvent({ requestId, action: options.action, result: "error", errorCategory: "bad_origin" });
    return jsonError("BAD_ORIGIN", "Request origin is not allowed.", 403);
  }

  if (options.rateLimit) {
    const result = rateLimit(
      limitKey([options.action, ip]),
      options.rateLimit.limit,
      options.rateLimit.windowMs,
    );
    if (!result.ok) {
      logEvent({ requestId, action: options.action, result: "error", errorCategory: "rate_limited" });
      const response = jsonError("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
      response.headers.set("retry-after", String(Math.ceil(result.retryAfterMs / 1000)));
      return response;
    }
  }

  try {
    const response = await handler({ requestId, ip });
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      logEvent({ requestId, action: options.action, result: "error", errorCategory: error.code });
      return jsonError(error.code, error.message, error.status);
    }

    if (error instanceof ZodError) {
      logEvent({ requestId, action: options.action, result: "error", errorCategory: "validation" });
      return jsonError("VALIDATION_ERROR", messageFor(error), 422);
    }

    if (error instanceof PaymentConfigurationError) {
      logEvent({ requestId, action: options.action, result: "error", errorCategory: "payment_config" });
      return jsonError("PAYMENTS_UNAVAILABLE", error.message, 503);
    }

    logEvent({
      requestId,
      action: options.action,
      result: "error",
      errorCategory: error instanceof Error ? error.name : "unknown",
      metadata: { detail: error instanceof Error ? error.message : String(error) },
    });
    return jsonError("INTERNAL_ERROR", messageFor(error), 500);
  }
}

export async function parseBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AuthError("Send a valid JSON body.", "INVALID_BODY", 400);
  }
  return schema.parse(raw) as z.infer<TSchema>;
}

export function noStore<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set("cache-control", "no-store");
  return response;
}
