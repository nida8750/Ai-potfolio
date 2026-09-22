/**
 * Kept separate from the session module so the proxy can read cookie names
 * without pulling server-only crypto and header APIs into its bundle.
 */
export const SESSION_COOKIE = "nida_session";

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

export function hasSessionCookie(
  cookies: Array<{ name: string; value?: string }>,
): boolean {
  return cookies.some((cookie) => {
    if (!cookie.value) {
      return false;
    }
    return cookie.name === SESSION_COOKIE || isSupabaseAuthCookieName(cookie.name);
  });
}
