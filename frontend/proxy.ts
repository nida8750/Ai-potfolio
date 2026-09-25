import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasSessionCookie } from "@/lib/auth/cookie";

/**
 * Convenience redirect only. It checks that a session cookie is present, not
 * that it is valid or that the user is an admin: every protected page and API
 * route repeats the real authorization check on the server.
 */
export function proxy(request: NextRequest) {
  const hasSession = hasSessionCookie(request.cookies.getAll());
  const path = request.nextUrl.pathname;

  if (!hasSession) {
    const loginPath =
      path === "/admin" ||
      path.startsWith("/admin/") ||
      path === "/dashboard" ||
      path.startsWith("/dashboard/")
        ? "/admin-login"
        : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin", "/admin/:path*"],
};
