import "server-only";
import { createId, nowIso } from "@/lib/data/ids";
import { repository } from "@/lib/data/repository";
import { env } from "@/lib/env";
import { slugify } from "@/lib/validation/common";
import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";
import type { z } from "zod";
import type { projectInputSchema } from "@/lib/validation/project";
import type { serviceInputSchema } from "@/lib/validation/service";

type ServiceInput = z.infer<typeof serviceInputSchema>;
type ProjectInput = z.infer<typeof projectInputSchema>;

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

async function uniqueServiceSlug(desired: string, ownId?: string): Promise<string> {
  const existing = await repository.getServiceBySlug(desired);
  if (existing && existing.id !== ownId) {
    throw new ConflictError("Another service already uses that slug.");
  }
  return desired;
}

async function uniqueProjectSlug(desired: string, ownId?: string): Promise<string> {
  const existing = await repository.getProjectBySlug(desired);
  if (existing && existing.id !== ownId) {
    throw new ConflictError("Another project already uses that slug.");
  }
  return desired;
}

export async function createService(input: ServiceInput): Promise<StoredService> {
  const timestamp = nowIso();
  const slug = await uniqueServiceSlug(input.slug ?? slugify(input.title));

  return repository.saveService({
    id: createId(),
    slug,
    title: input.title,
    description: input.description,
    shortDescription: input.shortDescription ?? input.description.slice(0, 200),
    technologies: input.technologies,
    price: input.pricingType === "custom" ? null : (input.price ?? null),
    currency: input.currency ?? env.defaultCurrency,
    pricingType: input.pricingType,
    icon: input.icon,
    isActive: input.isActive,
    featured: input.featured,
    sortOrder: input.sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateService(
  current: StoredService,
  patch: Partial<ServiceInput>,
): Promise<StoredService> {
  const pricingType = patch.pricingType ?? current.pricingType;
  const slug = patch.slug
    ? await uniqueServiceSlug(patch.slug, current.id)
    : patch.title
      ? await uniqueServiceSlug(slugify(patch.title), current.id)
      : current.slug;

  const price =
    pricingType === "custom"
      ? null
      : patch.price !== undefined
        ? patch.price
        : current.price;

  return repository.saveService({
    ...current,
    slug,
    title: patch.title ?? current.title,
    description: patch.description ?? current.description,
    shortDescription: patch.shortDescription ?? current.shortDescription,
    technologies: patch.technologies ?? current.technologies,
    price: price ?? null,
    currency: patch.currency ?? current.currency,
    pricingType,
    icon: patch.icon ?? current.icon,
    isActive: patch.isActive ?? current.isActive,
    featured: patch.featured ?? current.featured,
    sortOrder: patch.sortOrder ?? current.sortOrder,
    updatedAt: nowIso(),
  });
}

export async function createProject(input: ProjectInput): Promise<StoredProject> {
  const timestamp = nowIso();
  const slug = await uniqueProjectSlug(input.slug ?? slugify(input.title));

  return repository.saveProject({
    id: createId(),
    slug,
    title: input.title,
    category: input.category,
    description: input.description,
    technologies: input.technologies,
    image: input.image || undefined,
    imageKey: input.imageKey || undefined,
    githubUrl: input.githubUrl || undefined,
    liveUrl: input.liveUrl || undefined,
    featured: input.featured,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateProject(
  current: StoredProject,
  patch: Partial<ProjectInput>,
): Promise<StoredProject> {
  const slug = patch.slug
    ? await uniqueProjectSlug(patch.slug, current.id)
    : patch.title
      ? await uniqueProjectSlug(slugify(patch.title), current.id)
      : current.slug;

  return repository.saveProject({
    ...current,
    slug,
    title: patch.title ?? current.title,
    category: patch.category ?? current.category,
    description: patch.description ?? current.description,
    technologies: patch.technologies ?? current.technologies,
    image: patch.image !== undefined ? patch.image || undefined : current.image,
    imageKey: patch.imageKey !== undefined ? patch.imageKey || undefined : current.imageKey,
    githubUrl: patch.githubUrl !== undefined ? patch.githubUrl || undefined : current.githubUrl,
    liveUrl: patch.liveUrl !== undefined ? patch.liveUrl || undefined : current.liveUrl,
    featured: patch.featured ?? current.featured,
    isPublished: patch.isPublished ?? current.isPublished,
    sortOrder: patch.sortOrder ?? current.sortOrder,
    updatedAt: nowIso(),
  });
}
