import { jsonError } from "@/lib/security/http";
import { AuthError, requireAdmin, requireAuth } from "@/lib/auth/server";
import type { AuthUser } from "@/lib/auth/session";

export async function withAuth(): Promise<AuthUser | ReturnType<typeof jsonError>> {
  try {
    return await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.code, error.message, error.status);
    }
    throw error;
  }
}

export async function withAdmin(): Promise<AuthUser | ReturnType<typeof jsonError>> {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.code, error.message, error.status);
    }
    throw error;
  }
}

export function isErrorResponse(
  value: AuthUser | ReturnType<typeof jsonError>,
): value is ReturnType<typeof jsonError> {
  return value instanceof Response;
}
