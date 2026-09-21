import { createHash, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, derived] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !derived) {
    return false;
  }
  const check = scryptSync(password, salt, KEYLEN).toString("hex");
  const left = Buffer.from(derived, "hex");
  const right = Buffer.from(check, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
