import type { AuditLog } from "@/types/audit";
import type { Inquiry } from "@/types/inquiry";
import type { AppNotification } from "@/types/notification";
import type { Order } from "@/types/order";
import type { PaymentRecord } from "@/types/payment";
import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";
import type { PlatformSettings } from "@/types/settings";
import type { UserProfile } from "@/types/user";

function asIso(value: string | null | undefined): string {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredNumber(value: unknown): number {
  return asNumber(value) ?? 0;
}

export function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    phone: row.phone ? String(row.phone) : undefined,
    role: row.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    status: row.status === "disabled" ? "disabled" : "active",
    cognitoSub: row.cognito_sub ? String(row.cognito_sub) : undefined,
    supabaseUserId: String(row.id),
    createdAt: asIso(row.created_at as string | undefined),
    updatedAt: asIso(row.updated_at as string | undefined),
  };
}

export function profileRow(user: UserProfile): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name,
    phone: user.phone ?? null,
    role: user.role,
    avatar_url: user.avatarUrl ?? null,
    status: user.status,
    cognito_sub: user.cognitoSub ?? null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export function mapService(row: Record<string, unknown>): StoredService {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description),
    shortDescription: String(row.short_description ?? row.description ?? ""),
    technologies: Array.isArray(row.technologies) ? (row.technologies as string[]) : [],
    price: asNumber(row.price),
    currency: String(row.currency ?? "USD"),
    pricingType:
      row.pricing_type === "fixed" || row.pricing_type === "starting_from"
        ? row.pricing_type
        : "custom",
    icon: String(row.icon ?? "agents"),
    isActive: Boolean(row.is_active),
    featured: Boolean(row.featured),
    sortOrder: requiredNumber(row.sort_order),
    createdAt: asIso(row.created_at as string | undefined),
    updatedAt: asIso(row.updated_at as string | undefined),
  };
}

export function serviceRow(service: StoredService): Record<string, unknown> {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    description: service.description,
    short_description: service.shortDescription,
    technologies: service.technologies,
    price: service.price,
    currency: service.currency,
    pricing_type: service.pricingType,
    icon: service.icon,
    is_active: service.isActive,
    featured: service.featured,
    sort_order: service.sortOrder,
    created_at: service.createdAt,
    updated_at: service.updatedAt,
  };
}

export function mapProject(row: Record<string, unknown>): StoredProject {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    category: String(row.category),
    description: String(row.description),
    technologies: Array.isArray(row.technologies) ? (row.technologies as string[]) : [],
    image: row.image ? String(row.image) : undefined,
    imageKey: row.image_key ? String(row.image_key) : undefined,
    githubUrl: row.github_url ? String(row.github_url) : undefined,
    liveUrl: row.live_url ? String(row.live_url) : undefined,
    featured: Boolean(row.featured),
    isPublished: Boolean(row.is_published),
    sortOrder: requiredNumber(row.sort_order),
    createdAt: asIso(row.created_at as string | undefined),
    updatedAt: asIso(row.updated_at as string | undefined),
  };
}

export function projectRow(project: StoredProject): Record<string, unknown> {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    description: project.description,
    technologies: project.technologies,
    image: project.image ?? null,
    image_key: project.imageKey ?? null,
    github_url: project.githubUrl ?? null,
    live_url: project.liveUrl ?? null,
    featured: project.featured,
    is_published: project.isPublished,
    sort_order: project.sortOrder,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

export function mapInquiry(row: Record<string, unknown>): Inquiry {
  const status = String(row.status);
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : undefined,
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : undefined,
    serviceId: row.service_id ? String(row.service_id) : undefined,
    subject: row.subject ? String(row.subject) : undefined,
    message: String(row.message),
    status:
      status === "in_progress" || status === "completed" || status === "closed"
        ? status
        : "new",
    source: row.source === "service_request" ? "service_request" : "contact",
    createdAt: asIso(row.created_at as string | undefined),
    updatedAt: asIso(row.updated_at as string | undefined),
  };
}

export function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    serviceId: String(row.service_id),
    customerEmail: String(row.customer_email),
    customerName: String(row.customer_name),
    amount: requiredNumber(row.amount),
    currency: String(row.currency),
    paymentProvider:
      row.payment_provider === "stripe" || row.payment_provider === "paypal"
        ? row.payment_provider
        : undefined,
    paymentStatus: (row.payment_status as Order["paymentStatus"]) ?? "pending",
    orderStatus: (row.order_status as Order["orderStatus"]) ?? "pending",
    providerOrderId: row.provider_order_id ? String(row.provider_order_id) : undefined,
    providerPaymentId: row.provider_payment_id
      ? String(row.provider_payment_id)
      : undefined,
    createdAt: asIso(row.created_at as string | undefined),
    updatedAt: asIso(row.updated_at as string | undefined),
  };
}

export function orderRow(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    user_id: order.userId,
    service_id: order.serviceId,
    customer_email: order.customerEmail,
    customer_name: order.customerName,
    amount: order.amount,
    currency: order.currency,
    payment_provider: order.paymentProvider ?? null,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    provider_order_id: order.providerOrderId ?? null,
    provider_payment_id: order.providerPaymentId ?? null,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export function mapPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    userId: String(row.user_id),
    provider: row.provider === "paypal" ? "paypal" : "stripe",
    providerPaymentId: row.provider_payment_id
      ? String(row.provider_payment_id)
      : undefined,
    providerOrderId: row.provider_order_id ? String(row.provider_order_id) : undefined,
    amount: requiredNumber(row.amount),
    currency: String(row.currency),
    status: (row.status as PaymentRecord["status"]) ?? "pending",
    eventId: row.event_id ? String(row.event_id) : undefined,
    createdAt: asIso(row.created_at as string | undefined),
    updatedAt: asIso(row.updated_at as string | undefined),
  };
}

export function paymentRow(payment: PaymentRecord): Record<string, unknown> {
  return {
    id: payment.id,
    order_id: payment.orderId,
    user_id: payment.userId,
    provider: payment.provider,
    provider_payment_id: payment.providerPaymentId ?? null,
    provider_order_id: payment.providerOrderId ?? null,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    event_id: payment.eventId ?? null,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt,
  };
}

export function mapNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type as AppNotification["type"],
    title: String(row.title),
    message: String(row.message),
    read: Boolean(row.read),
    createdAt: asIso(row.created_at as string | undefined),
  };
}

export function mapAudit(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    actorId: String(row.actor_id),
    action: String(row.action),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    metadata: (row.metadata as AuditLog["metadata"]) ?? undefined,
    createdAt: asIso(row.created_at as string | undefined),
  };
}

export function mapSettings(row: Record<string, unknown>): PlatformSettings {
  return {
    id: "platform",
    defaultCurrency: String(row.default_currency),
    paymentProvider:
      row.payment_provider === "stripe" || row.payment_provider === "paypal"
        ? row.payment_provider
        : "none",
    bookingsEnabled: Boolean(row.bookings_enabled),
    updatedAt: asIso(row.updated_at as string | undefined),
    updatedBy: row.updated_by ? String(row.updated_by) : undefined,
  };
}

export function settingsRow(settings: PlatformSettings): Record<string, unknown> {
  return {
    id: "platform",
    default_currency: settings.defaultCurrency,
    payment_provider: settings.paymentProvider,
    bookings_enabled: settings.bookingsEnabled,
    updated_at: settings.updatedAt,
    updated_by: settings.updatedBy ?? null,
  };
}
