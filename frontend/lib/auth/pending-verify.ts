const STORAGE_KEY = "nida-pending-verify";

export interface PendingVerify {
  email: string;
  code: string | null;
}

export function readPendingVerify(): PendingVerify | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PendingVerify>;
    if (!parsed.email || typeof parsed.email !== "string") {
      return null;
    }
    return {
      email: parsed.email,
      code: typeof parsed.code === "string" && parsed.code ? parsed.code : null,
    };
  } catch {
    return null;
  }
}

export function writePendingVerify(email: string, code?: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ email, code: code ?? null }),
  );
}

export function clearPendingVerify(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(STORAGE_KEY);
}
