import { z } from "zod";
import { publicUrlSchema, slugSchema } from "@/lib/validation/common";

export const projectInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(2000),
  technologies: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  image: z.string().trim().max(300).optional(),
  imageKey: z.string().trim().max(300).optional(),
  githubUrl: publicUrlSchema,
  liveUrl: publicUrlSchema,
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});

export const projectUpdateSchema = projectInputSchema.partial();
