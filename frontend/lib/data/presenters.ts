import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";

export interface PublicService {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  technologies: string[];
  price: number | null;
  currency: string;
  pricingType: StoredService["pricingType"];
  icon: string;
  featured: boolean;
  sortOrder: number;
  purchasable: boolean;
}

export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  technologies: string[];
  image?: string;
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  sortOrder: number;
}

export function toPublicService(service: StoredService): PublicService {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    description: service.description,
    shortDescription: service.shortDescription || service.description,
    technologies: service.technologies,
    price: service.pricingType === "custom" ? null : service.price,
    currency: service.currency,
    pricingType: service.pricingType,
    icon: service.icon,
    featured: service.featured,
    sortOrder: service.sortOrder,
    purchasable: service.pricingType !== "custom" && (service.price ?? 0) > 0,
  };
}

export function toPublicProject(project: StoredProject): PublicProject {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    category: project.category,
    description: project.description,
    technologies: project.technologies,
    image: project.image,
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
    featured: project.featured,
    sortOrder: project.sortOrder,
  };
}
