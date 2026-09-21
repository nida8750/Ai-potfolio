import { z } from "zod";
import { env } from "@/lib/env";

export const emailSchema = z.string().trim().email().max(254);
export const nameSchema = z.string().trim().min(2).max(80);
export const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .regex(/^[0-9+() .\-]*$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));
export const messageSchema = z.string().trim().min(10).max(4000);
export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");
export const idSchema = z.string().uuid();
export const currencySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => env.supportedCurrencies.includes(value), "Unsupported currency");

export const publicUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"), "Use an http(s) URL")
  .refine((value) => {
    try {
      const host = new URL(value).hostname;
      return host !== "localhost" && !host.endsWith(".local");
    } catch {
      return false;
    }
  }, "Use a public URL")
  .optional()
  .or(z.literal(""));

export function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
