export async function fetchSession() {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) {
    return { user: null as null };
  }
  const body = (await response.json()) as { success: boolean; data?: { user: unknown } };
  if (!body.success) {
    return { user: null as null };
  }
  return body.data ?? { user: null };
}
