/**
 * Only same-site paths are accepted as post-login destinations. Anything
 * absolute, protocol-relative, or backslash-escaped falls back to the
 * dashboard so the parameter cannot be used as an open redirect.
 */
export function safeInternalPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  if (value.includes("://")) {
    return fallback;
  }
  return value;
}
