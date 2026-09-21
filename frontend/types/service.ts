export type PricingType = "fixed" | "starting_from" | "custom";

export interface Service {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  shortDescription?: string;
  technologies: string[];
  price?: number | null;
  currency?: string;
  pricingType?: PricingType;
  icon?: string;
  isActive?: boolean;
  featured?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoredService extends Required<
  Pick<
    Service,
    | "id"
    | "slug"
    | "title"
    | "description"
    | "technologies"
    | "pricingType"
    | "icon"
    | "isActive"
    | "featured"
    | "sortOrder"
    | "createdAt"
    | "updatedAt"
  >
> {
  shortDescription: string;
  price: number | null;
  currency: string;
}
