import { createHmac, timingSafeEqual } from "node:crypto";

export function signN8nPayload(secret: string, body: string, timestamp: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifyN8nSignature(
  secret: string,
  body: string,
  timestamp: string | null,
  signature: string | null,
  nowMs = Date.now(),
): boolean {
  if (!secret || !timestamp || !signature) {
    return false;
  }
  const age = Math.abs(nowMs - Number(timestamp));
  if (!Number.isFinite(age) || age > 5 * 60 * 1000) {
    return false;
  }
  const expected = signN8nPayload(secret, body, timestamp);
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(signature, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}
