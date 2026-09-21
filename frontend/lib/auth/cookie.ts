/**
 * Kept separate from the session module so the proxy can read the cookie name
 * without pulling server-only crypto and header APIs into its bundle.
 */
export const SESSION_COOKIE = "nida_session";
