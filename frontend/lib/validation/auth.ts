import { z } from "zod";
import { emailSchema, emptyToUndefined, nameSchema, phoneSchema } from "@/lib/validation/common";

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Include a letter")
  .regex(/[0-9]/, "Include a number");

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.transform(emptyToUndefined),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Enter your password")
    .max(128, "Password is too long"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .min(4, "Enter the code from your email")
    .max(128, "Code is too long"),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .min(4, "Enter the 6-digit verification code")
    .max(128, "Code is too long"),
});

export const profileUpdateSchema = z.object({
  name: nameSchema,
  phone: phoneSchema.transform(emptyToUndefined),
});
