import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import type { AuthUser } from "@/lib/auth/session";

/**
 * Page-level guards. These run on the server for every render, so protection
 * does not depend on the proxy redirect or on hidden UI.
 */
export async function requireAuthOrRedirect(next: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}

export async function requireAdminOrRedirect(next: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/admin-login?next=${encodeURIComponent(next)}`);
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
