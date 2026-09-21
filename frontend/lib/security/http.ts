import { NextResponse } from "next/server";
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

export function assertSameOrigin(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
