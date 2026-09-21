import type { ApiResponse } from "@/types/api";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * Browser-side fetch wrapper that turns the shared API envelope into either a
 * typed payload or a thrown error carrying the server's message.
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};

  const response = await fetch(path, {
    ...rest,
    method: rest.method ?? (json ? "POST" : "GET"),
    headers: {
      ...(json ? { "content-type": "application/json" } : {}),
      ...rest.headers,
    },
    body: json ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });

  let payload: ApiResponse<T> | undefined;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError(
      "The server returned an unexpected response.",
      "BAD_RESPONSE",
      response.status,
    );
  }

  if (!payload.success) {
    throw new ApiRequestError(payload.error.message, payload.error.code, response.status);
  }

  return payload.data;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
