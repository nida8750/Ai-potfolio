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
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(4).max(128),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(4).max(128),
});

export const profileUpdateSchema = z.object({
  name: nameSchema,
  phone: phoneSchema.transform(emptyToUndefined),
});
