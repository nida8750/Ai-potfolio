import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import type { ApiError, ApiSuccess } from "@/types/api";

export function jsonSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * CSRF guard for state changing requests. The Origin header is compared with
 * the host the request actually arrived on (and the configured app URL),
 * because `request.url` is rewritten internally and does not carry the public
 * host. A missing Origin is allowed: browsers always send one on cross-site
 * writes, while server-to-server clients often send none.
 */
export function assertSameOrigin(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (requestHost && originHost === requestHost) {
    return true;
  }

  try {
    return new URL(env.appUrl).host === originHost;
  } catch {
    return false;
  }
}
