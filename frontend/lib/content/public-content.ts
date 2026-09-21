import "server-only";
import { catalogProjects, catalogServices } from "@/lib/data/seed";
import { toPublicProject, toPublicService } from "@/lib/data/presenters";
import { repository } from "@/lib/data/repository";
import { logEvent } from "@/lib/security/logger";
import type { PublicProject, PublicService } from "@/lib/data/presenters";

export interface ContentResult<T> {
  items: T[];
  /** True when the datastore could not be read and the seed catalog was used. */
  degraded: boolean;
}

/**
 * Public sections read from the datastore. If that read fails the request is
 * still served from the seed catalog the database is provisioned from, and the
 * degradation is logged rather than passed off as live data.
 */
export async function loadPublicServices(): Promise<ContentResult<PublicService>> {
  try {
    const services = await repository.listServices({ activeOnly: true });
    return { items: services.map(toPublicService), degraded: false };
  } catch (error) {
    logEvent({
      action: "content.services",
      result: "error",
      errorCategory: error instanceof Error ? error.name : "unknown",
      metadata: { fallback: "seed_catalog" },
    });
    return { items: catalogServices().map(toPublicService), degraded: true };
  }
}

export async function loadPublicProjects(): Promise<ContentResult<PublicProject>> {
  try {
    const projects = await repository.listProjects({ publishedOnly: true });
    return { items: projects.map(toPublicProject), degraded: false };
  } catch (error) {
    logEvent({
      action: "content.projects",
      result: "error",
      errorCategory: error instanceof Error ? error.name : "unknown",
      metadata: { fallback: "seed_catalog" },
    });
    return { items: catalogProjects().map(toPublicProject), degraded: true };
  }
}
