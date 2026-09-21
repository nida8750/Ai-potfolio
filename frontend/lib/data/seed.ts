import "server-only";
import { projects as seedProjects } from "@/data/projects";
import { services as seedServices } from "@/data/services";
import { env } from "@/lib/env";
import { createId, nowIso } from "@/lib/data/ids";
import { slugify } from "@/lib/validation/common";
import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";
import type { PlatformSettings } from "@/types/settings";

export function catalogServices(): StoredService[] {
  const timestamp = nowIso();
  return seedServices.map((service, index) => ({
    id: createId(),
    slug: slugify(service.title),
    title: service.title,
    description: service.description,
    shortDescription: service.description,
    technologies: service.technologies,
    price: null,
    currency: env.defaultCurrency,
    pricingType: "custom",
    icon: service.icon ?? "agents",
    isActive: true,
    featured: index === 0,
    sortOrder: index,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export function catalogProjects(): StoredProject[] {
  const timestamp = nowIso();
  return seedProjects.map((project, index) => ({
    id: createId(),
    title: project.title,
    slug: project.slug,
    category: project.category,
    description: project.description,
    technologies: project.technologies,
    image: project.image,
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
    featured: Boolean(project.featured),
    isPublished: true,
    sortOrder: index,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export function defaultSettings(): PlatformSettings {
  return {
    id: "platform",
    defaultCurrency: env.defaultCurrency,
    paymentProvider: env.paymentProvider,
    bookingsEnabled: true,
    updatedAt: nowIso(),
  };
}