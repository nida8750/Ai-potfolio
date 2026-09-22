import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createId, nowIso } from "@/lib/data/ids";
import { catalogProjects, catalogServices, defaultSettings } from "@/lib/data/seed";
import {
  mapAudit,
  mapInquiry,
  mapNotification,
  mapOrder,
  mapPayment,
  mapProfile,
  mapProject,
  mapService,
  mapSettings,
  orderRow,
  paymentRow,
  profileRow,
  projectRow,
  serviceRow,
  settingsRow,
} from "@/lib/supabase/map";
import type { CredentialRecord } from "@/lib/data/local";
import type { PlatformOverview, PlatformRepository } from "@/lib/data/local-repository";
import type { AuditLog } from "@/types/audit";
import type { Inquiry, InquiryStatus } from "@/types/inquiry";
import type { NotificationType } from "@/types/notification";
import type { Order } from "@/types/order";
import type { PaymentRecord, ProcessedEvent } from "@/types/payment";
import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";
import type { PlatformSettings } from "@/types/settings";
import type { UserProfile } from "@/types/user";

function credentialsUnsupported(): never {
  throw new Error(
    "Password credentials are never stored in Postgres. Configure Supabase Auth when DATA_STORE=supabase.",
  );
}

function throwIfError<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string,
): T {
  if (result.error) {
    throw new Error(`Supabase ${context}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`Supabase ${context}: no data`);
  }
  return result.data;
}

let seedPromise: Promise<void> | undefined;

async function ensureSeeded(): Promise<void> {
  seedPromise ??= (async () => {
    const client = supabaseAdmin();
    const services = await client.from("services").select("id", { count: "exact", head: true });
    if (services.error) {
      throw new Error(`Supabase seed check: ${services.error.message}`);
    }
    if ((services.count ?? 0) === 0) {
      const rows = catalogServices().map(serviceRow);
      const inserted = await client.from("services").insert(rows);
      if (inserted.error) {
        throw new Error(`Supabase seed services: ${inserted.error.message}`);
      }
    }

    const projects = await client.from("projects").select("id", { count: "exact", head: true });
    if (projects.error) {
      throw new Error(`Supabase seed check: ${projects.error.message}`);
    }
    if ((projects.count ?? 0) === 0) {
      const rows = catalogProjects().map(projectRow);
      const inserted = await client.from("projects").insert(rows);
      if (inserted.error) {
        throw new Error(`Supabase seed projects: ${inserted.error.message}`);
      }
    }

    const settings = await client.from("platform_settings").select("id").eq("id", "platform").maybeSingle();
    if (settings.error) {
      throw new Error(`Supabase seed check: ${settings.error.message}`);
    }
    if (!settings.data) {
      const inserted = await client.from("platform_settings").insert(settingsRow(defaultSettings()));
      if (inserted.error) {
        throw new Error(`Supabase seed settings: ${inserted.error.message}`);
      }
    }
  })();

  return seedPromise;
}

export const supabaseRepository: PlatformRepository = {
  async getUser(id) {
    const result = await supabaseAdmin().from("profiles").select("*").eq("id", id).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getUser: ${result.error.message}`);
    }
    return result.data ? mapProfile(result.data) : undefined;
  },

  async getUserByEmail(email) {
    const result = await supabaseAdmin()
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getUserByEmail: ${result.error.message}`);
    }
    return result.data ? mapProfile(result.data) : undefined;
  },

  async listUsers() {
    const result = await supabaseAdmin()
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    return throwIfError(result, "listUsers").map((row) => mapProfile(row));
  },

  async createUser(input: Omit<UserProfile, "createdAt" | "updatedAt">) {
    const timestamp = nowIso();
    const user: UserProfile = {
      ...input,
      email: input.email.toLowerCase(),
      supabaseUserId: input.supabaseUserId ?? input.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const result = await supabaseAdmin()
      .from("profiles")
      .upsert(profileRow(user), { onConflict: "id" })
      .select("*")
      .single();
    return mapProfile(throwIfError(result, "createUser"));
  },

  async updateUser(id, patch) {
    const current = await this.getUser(id);
    if (!current) {
      return undefined;
    }
    const next: UserProfile = {
      ...current,
      ...patch,
      id: current.id,
      email: current.email,
      createdAt: current.createdAt,
      updatedAt: nowIso(),
    };
    const result = await supabaseAdmin()
      .from("profiles")
      .update(profileRow(next))
      .eq("id", id)
      .select("*")
      .single();
    return mapProfile(throwIfError(result, "updateUser"));
  },

  async countUsers() {
    const result = await supabaseAdmin().from("profiles").select("id", { count: "exact", head: true });
    if (result.error) {
      throw new Error(`Supabase countUsers: ${result.error.message}`);
    }
    return result.count ?? 0;
  },

  async getCredential(): Promise<CredentialRecord | undefined> {
    return credentialsUnsupported();
  },

  async putCredential(): Promise<void> {
    return credentialsUnsupported();
  },

  async listServices(options) {
    await ensureSeeded();
    let query = supabaseAdmin().from("services").select("*");
    if (options?.activeOnly) {
      query = query.eq("is_active", true);
    }
    const result = await query.order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    return throwIfError(result, "listServices").map((row) => mapService(row));
  },

  async getService(id) {
    const result = await supabaseAdmin().from("services").select("*").eq("id", id).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getService: ${result.error.message}`);
    }
    return result.data ? mapService(result.data) : undefined;
  },

  async getServiceBySlug(slug) {
    const result = await supabaseAdmin().from("services").select("*").eq("slug", slug).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getServiceBySlug: ${result.error.message}`);
    }
    return result.data ? mapService(result.data) : undefined;
  },

  async saveService(service: StoredService) {
    const result = await supabaseAdmin()
      .from("services")
      .upsert(serviceRow(service), { onConflict: "id" })
      .select("*")
      .single();
    return mapService(throwIfError(result, "saveService"));
  },

  async deleteService(id) {
    const result = await supabaseAdmin().from("services").delete().eq("id", id).select("id");
    return throwIfError(result, "deleteService").length > 0;
  },

  async listProjects(options) {
    await ensureSeeded();
    let query = supabaseAdmin().from("projects").select("*");
    if (options?.publishedOnly) {
      query = query.eq("is_published", true);
    }
    const result = await query.order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    return throwIfError(result, "listProjects").map((row) => mapProject(row));
  },

  async getProject(id) {
    const result = await supabaseAdmin().from("projects").select("*").eq("id", id).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getProject: ${result.error.message}`);
    }
    return result.data ? mapProject(result.data) : undefined;
  },

  async getProjectBySlug(slug) {
    const result = await supabaseAdmin().from("projects").select("*").eq("slug", slug).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getProjectBySlug: ${result.error.message}`);
    }
    return result.data ? mapProject(result.data) : undefined;
  },

  async saveProject(project: StoredProject) {
    const result = await supabaseAdmin()
      .from("projects")
      .upsert(projectRow(project), { onConflict: "id" })
      .select("*")
      .single();
    return mapProject(throwIfError(result, "saveProject"));
  },

  async deleteProject(id) {
    const result = await supabaseAdmin().from("projects").delete().eq("id", id).select("id");
    return throwIfError(result, "deleteProject").length > 0;
  },

  async createInquiry(
    input: Omit<Inquiry, "id" | "createdAt" | "updatedAt" | "status"> & { status?: InquiryStatus },
  ) {
    const timestamp = nowIso();
    const inquiry: Inquiry = {
      ...input,
      id: createId(),
      status: input.status ?? "new",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const result = await supabaseAdmin()
      .from("inquiries")
      .insert({
        id: inquiry.id,
        user_id: inquiry.userId ?? null,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone ?? null,
        service_id: inquiry.serviceId ?? null,
        subject: inquiry.subject ?? null,
        message: inquiry.message,
        status: inquiry.status,
        source: inquiry.source,
        created_at: inquiry.createdAt,
        updated_at: inquiry.updatedAt,
      })
      .select("*")
      .single();
    return mapInquiry(throwIfError(result, "createInquiry"));
  },

  async listInquiries(userId) {
    let query = supabaseAdmin().from("inquiries").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const result = await query.order("created_at", { ascending: false });
    return throwIfError(result, "listInquiries").map((row) => mapInquiry(row));
  },

  async getInquiry(id) {
    const result = await supabaseAdmin().from("inquiries").select("*").eq("id", id).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getInquiry: ${result.error.message}`);
    }
    return result.data ? mapInquiry(result.data) : undefined;
  },

  async updateInquiry(id, patch) {
    const current = await this.getInquiry(id);
    if (!current) {
      return undefined;
    }
    const next: Inquiry = { ...current, ...patch, id: current.id, updatedAt: nowIso() };
    const result = await supabaseAdmin()
      .from("inquiries")
      .update({
        user_id: next.userId ?? null,
        name: next.name,
        email: next.email,
        phone: next.phone ?? null,
        service_id: next.serviceId ?? null,
        subject: next.subject ?? null,
        message: next.message,
        status: next.status,
        source: next.source,
        updated_at: next.updatedAt,
      })
      .eq("id", id)
      .select("*")
      .single();
    return mapInquiry(throwIfError(result, "updateInquiry"));
  },

  async createOrder(input: Omit<Order, "id" | "createdAt" | "updatedAt">) {
    const timestamp = nowIso();
    const order: Order = { ...input, id: createId(), createdAt: timestamp, updatedAt: timestamp };
    const result = await supabaseAdmin()
      .from("orders")
      .insert(orderRow(order))
      .select("*")
      .single();
    return mapOrder(throwIfError(result, "createOrder"));
  },

  async listOrders(userId) {
    let query = supabaseAdmin().from("orders").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const result = await query.order("created_at", { ascending: false });
    return throwIfError(result, "listOrders").map((row) => mapOrder(row));
  },

  async getOrder(id) {
    const result = await supabaseAdmin().from("orders").select("*").eq("id", id).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getOrder: ${result.error.message}`);
    }
    return result.data ? mapOrder(result.data) : undefined;
  },

  async getOrderByProviderOrderId(provider, providerOrderId) {
    const result = await supabaseAdmin()
      .from("orders")
      .select("*")
      .eq("payment_provider", provider)
      .eq("provider_order_id", providerOrderId)
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getOrderByProviderOrderId: ${result.error.message}`);
    }
    return result.data ? mapOrder(result.data) : undefined;
  },

  async updateOrder(id, patch) {
    const current = await this.getOrder(id);
    if (!current) {
      return undefined;
    }
    const next: Order = { ...current, ...patch, id: current.id, updatedAt: nowIso() };
    const result = await supabaseAdmin()
      .from("orders")
      .update(orderRow(next))
      .eq("id", id)
      .select("*")
      .single();
    return mapOrder(throwIfError(result, "updateOrder"));
  },

  async createPayment(input: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">) {
    const timestamp = nowIso();
    const payment: PaymentRecord = { ...input, id: createId(), createdAt: timestamp, updatedAt: timestamp };
    const result = await supabaseAdmin()
      .from("payments")
      .insert(paymentRow(payment))
      .select("*")
      .single();
    return mapPayment(throwIfError(result, "createPayment"));
  },

  async listPayments(userId) {
    let query = supabaseAdmin().from("payments").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const result = await query.order("created_at", { ascending: false });
    return throwIfError(result, "listPayments").map((row) => mapPayment(row));
  },

  async getPayment(id) {
    const result = await supabaseAdmin().from("payments").select("*").eq("id", id).maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getPayment: ${result.error.message}`);
    }
    return result.data ? mapPayment(result.data) : undefined;
  },

  async getPaymentByEvent(provider, eventId) {
    const result = await supabaseAdmin()
      .from("payments")
      .select("*")
      .eq("provider", provider)
      .eq("event_id", eventId)
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getPaymentByEvent: ${result.error.message}`);
    }
    return result.data ? mapPayment(result.data) : undefined;
  },

  async updatePayment(id, patch) {
    const current = await this.getPayment(id);
    if (!current) {
      return undefined;
    }
    const next: PaymentRecord = { ...current, ...patch, id: current.id, updatedAt: nowIso() };
    const result = await supabaseAdmin()
      .from("payments")
      .update(paymentRow(next))
      .eq("id", id)
      .select("*")
      .single();
    return mapPayment(throwIfError(result, "updatePayment"));
  },

  async hasProcessedEvent(provider: ProcessedEvent["provider"], eventId: string) {
    const result = await supabaseAdmin()
      .from("processed_events")
      .select("id")
      .eq("provider", provider)
      .eq("event_id", eventId)
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase hasProcessedEvent: ${result.error.message}`);
    }
    return Boolean(result.data);
  },

  async recordProcessedEvent(provider: ProcessedEvent["provider"], eventId: string) {
    const result = await supabaseAdmin().from("processed_events").upsert(
      {
        id: createId(),
        provider,
        event_id: eventId,
        created_at: nowIso(),
      },
      { onConflict: "provider,event_id", ignoreDuplicates: true },
    );
    if (result.error) {
      throw new Error(`Supabase recordProcessedEvent: ${result.error.message}`);
    }
  },

  async createNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    const notification = {
      id: createId(),
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      created_at: nowIso(),
    };
    const result = await supabaseAdmin()
      .from("notifications")
      .insert(notification)
      .select("*")
      .single();
    return mapNotification(throwIfError(result, "createNotification"));
  },

  async listNotifications(userId) {
    const result = await supabaseAdmin()
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return throwIfError(result, "listNotifications").map((row) => mapNotification(row));
  },

  async unreadCount(userId) {
    const result = await supabaseAdmin()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (result.error) {
      throw new Error(`Supabase unreadCount: ${result.error.message}`);
    }
    return result.count ?? 0;
  },

  async markNotificationRead(id, userId) {
    const result = await supabaseAdmin()
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase markNotificationRead: ${result.error.message}`);
    }
    return result.data ? mapNotification(result.data) : undefined;
  },

  async writeAudit(input: Omit<AuditLog, "id" | "createdAt">) {
    const result = await supabaseAdmin().from("audit_logs").insert({
      id: createId(),
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata ?? {},
      created_at: nowIso(),
    });
    if (result.error) {
      throw new Error(`Supabase writeAudit: ${result.error.message}`);
    }
  },

  async listAuditLogs() {
    const result = await supabaseAdmin()
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });
    return throwIfError(result, "listAuditLogs").map((row) => mapAudit(row));
  },

  async getSettings() {
    await ensureSeeded();
    const result = await supabaseAdmin()
      .from("platform_settings")
      .select("*")
      .eq("id", "platform")
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase getSettings: ${result.error.message}`);
    }
    return result.data ? mapSettings(result.data) : defaultSettings();
  },

  async saveSettings(settings: PlatformSettings) {
    const result = await supabaseAdmin()
      .from("platform_settings")
      .upsert(settingsRow(settings), { onConflict: "id" })
      .select("*")
      .single();
    return mapSettings(throwIfError(result, "saveSettings"));
  },

  async overview(): Promise<PlatformOverview> {
    await ensureSeeded();
    const [services, projects, orders, inquiries, users] = await Promise.all([
      this.listServices(),
      this.listProjects(),
      this.listOrders(),
      this.listInquiries(),
      this.countUsers(),
    ]);

    return {
      totalServices: services.length,
      activeServices: services.filter((item) => item.isActive).length,
      totalProjects: projects.length,
      publishedProjects: projects.filter((item) => item.isPublished).length,
      inquiries: inquiries.length,
      pendingOrders: orders.filter((item) => item.orderStatus === "pending").length,
      paidOrders: orders.filter((item) => item.paymentStatus === "paid").length,
      users,
    };
  },
};
