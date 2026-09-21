import { z } from "zod";
import { currencySchema, slugSchema } from "@/lib/validation/common";

export const serviceInputSchema = z
  .object({
    title: z.string().trim().min(2).max(80),
    slug: slugSchema.optional(),
    description: z.string().trim().min(10).max(2000),
    shortDescription: z.string().trim().max(200).optional(),
    technologies: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
    price: z.number().nonnegative().nullable().optional(),
    currency: currencySchema.optional(),
    pricingType: z.enum(["fixed", "starting_from", "custom"]),
    icon: z.enum(["agents", "rag", "automation", "voice"]).default("agents"),
    isActive: z.boolean().default(true),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(1000).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.pricingType === "custom" && value.price != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Custom quote services cannot carry a checkout price",
        path: ["price"],
      });
    }
    if (value.pricingType === "fixed" && (value.price == null || value.price <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fixed-price services need a price greater than 0",
        path: ["price"],
      });
    }
  });

export const serviceUpdateSchema = serviceInputSchema.partial();
