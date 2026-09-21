const SECRET_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "key",
  "signature",
];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const lower = key.toLowerCase();
        if (SECRET_KEYS.some((part) => lower.includes(part))) {
          return [key, "[redacted]"];
        }
        return [key, redact(entry)];
      }),
    );
  }
  return value;
}

export function logEvent(event: {
  requestId?: string;
  userId?: string;
  action: string;
  result: "ok" | "error";
  errorCategory?: string;
  metadata?: Record<string, unknown>;
}): void {
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      ...event,
      metadata: event.metadata ? redact(event.metadata) : undefined,
    }),
  );
}
