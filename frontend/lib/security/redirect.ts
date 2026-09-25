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

function isAdminAppPath(path: string): boolean {
  return (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/dashboard" ||
    path.startsWith("/dashboard/")
  );
}

/** Customers stay on the public site. Only ADMIN may land on dashboard/admin. */
export function postLoginPath(
  role: "USER" | "ADMIN",
  next: string | null,
  fallback?: string,
): string {
  const home = fallback ?? (role === "ADMIN" ? "/dashboard" : "/");
  const path = safeInternalPath(next, home);
  if (role !== "ADMIN" && isAdminAppPath(path)) {
    return "/";
  }
  return path;
}
