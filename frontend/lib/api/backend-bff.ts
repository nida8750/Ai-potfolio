import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { requireAuth } from "@/lib/auth/server";
import { backendBaseUrl, env, isBlankOrPlaceholder, isSupabaseConfigured } from "@/lib/env";
import { jsonError } from "@/lib/security/http";
import { supabaseAccessToken } from "@/lib/supabase/auth";

const TIMEOUT_MS = 20_000;

export async function userBackendHeaders(): Promise<HeadersInit> {
  await requireAuth();
  const headers: Record<string, string> = { accept: "application/json" };
  if (isSupabaseConfigured()) {
    try {
      const token = await supabaseAccessToken();
      if (token) {
        headers.authorization = `Bearer ${token}`;
      }
    } catch {
      // Local auth has no FastAPI JWT.
    }
  }
  return headers;
}

export async function requireUserBackendHeaders(): Promise<HeadersInit> {
  const headers = await userBackendHeaders();
  if (!("authorization" in headers) && !("Authorization" in headers)) {
    throw new AuthError(
      "FastAPI user APIs need a Supabase session. Local-file-store logins cannot mint a token.",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }
  return headers;
}

export function internalBackendHeaders(): HeadersInit {
  const key = env.internalApiKey;
  if (isBlankOrPlaceholder(key) || !key) {
    throw new AuthError(
      "INTERNAL_API_KEY is not configured.",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }
  return {
    accept: "application/json",
    "X-Internal-Key": key,
  };
}

export async function proxyBackend(input: {
  path: string;
  method?: string;
  headers?: HeadersInit;
  json?: unknown;
  formData?: FormData;
  search?: string;
}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${backendBaseUrl()}${input.path}${input.search ?? ""}`;
  try {
    const init: RequestInit = {
      method: input.method ?? (input.json || input.formData ? "POST" : "GET"),
      cache: "no-store",
      signal: controller.signal,
      headers: input.headers,
    };
    if (input.formData) {
      init.body = input.formData;
    } else if (input.json !== undefined) {
      init.headers = {
        "content-type": "application/json",
        ...input.headers,
      };
      init.body = JSON.stringify(input.json);
    }
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      "FastAPI backend is not reachable.",
      "BACKEND_UNREACHABLE",
      503,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function passThroughBackend(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
      },
    });
  }
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    return jsonError("BAD_RESPONSE", "The backend returned an unexpected response.", 502);
  }
  return NextResponse.json(payload, { status: response.status });
}
