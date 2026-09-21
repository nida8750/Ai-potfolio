export interface Project {
  id?: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  technologies: string[];
  image?: string;
  imageKey?: string;
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoredProject extends Required<
  Pick<
    Project,
    | "id"
    | "title"
    | "slug"
    | "category"
    | "description"
    | "technologies"
    | "featured"
    | "isPublished"
    | "sortOrder"
    | "createdAt"
    | "updatedAt"
  >
> {
  image?: string;
  imageKey?: string;
  githubUrl?: string;
  liveUrl?: string;
}
