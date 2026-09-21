import "server-only";
import { withStore } from "@/lib/data/local";
import { createId, nowIso } from "@/lib/data/ids";
import type { AuditLog } from "@/types/audit";
import type { Inquiry, InquiryStatus } from "@/types/inquiry";
import type { AppNotification, NotificationType } from "@/types/notification";
import type { Order } from "@/types/order";
import type { PaymentRecord, ProcessedEvent } from "@/types/payment";
import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";
import type { PlatformSettings } from "@/types/settings";
import type { UserProfile } from "@/types/user";
import type { CredentialRecord } from "@/lib/data/local";

function sortByOrder<T extends { sortOrder: number; createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export const localRepository = {
  async getUser(id: string): Promise<UserProfile | undefined> {
    return withStore((store) => store.users.find((user) => user.id === id));
  },

  async getUserByEmail(email: string): Promise<UserProfile | undefined> {
    const normalized = email.toLowerCase();
    return withStore((store) => store.users.find((user) => user.email === normalized));
  },

  async listUsers(): Promise<UserProfile[]> {
    return withStore((store) =>
      [...store.users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async createUser(input: Omit<UserProfile, "createdAt" | "updatedAt">): Promise<UserProfile> {
    return withStore((store) => {
      const timestamp = nowIso();
      const user: UserProfile = { ...input, email: input.email.toLowerCase(), createdAt: timestamp, updatedAt: timestamp };
      store.users.push(user);
      return user;
    });
  },

  async updateUser(id: string, patch: Partial<UserProfile>): Promise<UserProfile | undefined> {
    return withStore((store) => {
      const user = store.users.find((item) => item.id === id);
      if (!user) {
        return undefined;
      }
      Object.assign(user, patch, { id: user.id, email: user.email, updatedAt: nowIso() });
      return user;
    });
  },

  async countUsers(): Promise<number> {
    return withStore((store) => store.users.length);
  },

  async getCredential(email: string): Promise<CredentialRecord | undefined> {
    const normalized = email.toLowerCase();
    return withStore((store) => store.credentials.find((item) => item.email === normalized));
  },

  async putCredential(record: CredentialRecord): Promise<void> {
    await withStore((store) => {
      const index = store.credentials.findIndex((item) => item.email === record.email);
      if (index >= 0) {
        store.credentials[index] = record;
      } else {
        store.credentials.push(record);
      }
    });
  },

  async listServices(options?: { activeOnly?: boolean }): Promise<StoredService[]> {
    return withStore((store) => {
      const items = options?.activeOnly
        ? store.services.filter((service) => service.isActive)
        : store.services;
      return sortByOrder(items);
    });
  },

  async getService(id: string): Promise<StoredService | undefined> {
    return withStore((store) => store.services.find((service) => service.id === id));
  },

  async getServiceBySlug(slug: string): Promise<StoredService | undefined> {
    return withStore((store) => store.services.find((service) => service.slug === slug));
  },

  async saveService(service: StoredService): Promise<StoredService> {
    return withStore((store) => {
      const index = store.services.findIndex((item) => item.id === service.id);
      if (index >= 0) {
        store.services[index] = service;
      } else {
        store.services.push(service);
      }
      return service;
    });
  },

  async deleteService(id: string): Promise<boolean> {
    return withStore((store) => {
      const next = store.services.filter((item) => item.id !== id);
      const changed = next.length !== store.services.length;
      store.services = next;
      return changed;
    });
  },

  async listProjects(options?: { publishedOnly?: boolean }): Promise<StoredProject[]> {
    return withStore((store) => {
      const items = options?.publishedOnly
        ? store.projects.filter((project) => project.isPublished)
        : store.projects;
      return sortByOrder(items);
    });
  },

  async getProject(id: string): Promise<StoredProject | undefined> {
    return withStore((store) => store.projects.find((project) => project.id === id));
  },

  async getProjectBySlug(slug: string): Promise<StoredProject | undefined> {
    return withStore((store) => store.projects.find((project) => project.slug === slug));
  },

  async saveProject(project: StoredProject): Promise<StoredProject> {
    return withStore((store) => {
      const index = store.projects.findIndex((item) => item.id === project.id);
      if (index >= 0) {
        store.projects[index] = project;
      } else {
        store.projects.push(project);
      }
      return project;
    });
  },

  async deleteProject(id: string): Promise<boolean> {
    return withStore((store) => {
      const next = store.projects.filter((item) => item.id !== id);
      const changed = next.length !== store.projects.length;
      store.projects = next;
      return changed;
    });
  },

  async createInquiry(input: Omit<Inquiry, "id" | "createdAt" | "updatedAt" | "status"> & { status?: InquiryStatus }): Promise<Inquiry> {
    return withStore((store) => {
      const timestamp = nowIso();
      const inquiry: Inquiry = {
        ...input,
        id: createId(),
        status: input.status ?? "new",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      store.inquiries.unshift(inquiry);
      return inquiry;
    });
  },

  async listInquiries(userId?: string): Promise<Inquiry[]> {
    return withStore((store) =>
      store.inquiries.filter((item) => (userId ? item.userId === userId : true)),
    );
  },

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    return withStore((store) => store.inquiries.find((item) => item.id === id));
  },

  async updateInquiry(id: string, patch: Partial<Inquiry>): Promise<Inquiry | undefined> {
    return withStore((store) => {
      const inquiry = store.inquiries.find((item) => item.id === id);
      if (!inquiry) {
        return undefined;
      }
      Object.assign(inquiry, patch, { id: inquiry.id, updatedAt: nowIso() });
      return inquiry;
    });
  },

  async createOrder(input: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
    return withStore((store) => {
      const timestamp = nowIso();
      const order: Order = { ...input, id: createId(), createdAt: timestamp, updatedAt: timestamp };
      store.orders.unshift(order);
      return order;
    });
  },

  async listOrders(userId?: string): Promise<Order[]> {
    return withStore((store) =>
      store.orders.filter((item) => (userId ? item.userId === userId : true)),
    );
  },

  async getOrder(id: string): Promise<Order | undefined> {
    return withStore((store) => store.orders.find((item) => item.id === id));
  },

  async updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
    return withStore((store) => {
      const order = store.orders.find((item) => item.id === id);
      if (!order) {
        return undefined;
      }
      Object.assign(order, patch, { id: order.id, updatedAt: nowIso() });
      return order;
    });
  },

  async createPayment(input: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">): Promise<PaymentRecord> {
    return withStore((store) => {
      const timestamp = nowIso();
      const payment: PaymentRecord = { ...input, id: createId(), createdAt: timestamp, updatedAt: timestamp };
      store.payments.unshift(payment);
      return payment;
    });
  },

  async listPayments(userId?: string): Promise<PaymentRecord[]> {
    return withStore((store) =>
      store.payments.filter((item) => (userId ? item.userId === userId : true)),
    );
  },

  async getPayment(id: string): Promise<PaymentRecord | undefined> {
    return withStore((store) => store.payments.find((item) => item.id === id));
  },

  async getPaymentByEvent(provider: PaymentRecord["provider"], eventId: string): Promise<PaymentRecord | undefined> {
    return withStore((store) =>
      store.payments.find((item) => item.provider === provider && item.eventId === eventId),
    );
  },

  async updatePayment(id: string, patch: Partial<PaymentRecord>): Promise<PaymentRecord | undefined> {
    return withStore((store) => {
      const payment = store.payments.find((item) => item.id === id);
      if (!payment) {
        return undefined;
      }
      Object.assign(payment, patch, { id: payment.id, updatedAt: nowIso() });
      return payment;
    });
  },

  async hasProcessedEvent(provider: ProcessedEvent["provider"], eventId: string): Promise<boolean> {
    return withStore((store) =>
      store.processedEvents.some((item) => item.provider === provider && item.eventId === eventId),
    );
  },

  async recordProcessedEvent(provider: ProcessedEvent["provider"], eventId: string): Promise<void> {
    await withStore((store) => {
      if (store.processedEvents.some((item) => item.provider === provider && item.eventId === eventId)) {
        return;
      }
      store.processedEvents.push({
        id: createId(),
        provider,
        eventId,
        createdAt: nowIso(),
      });
    });
  },

  async createNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
  }): Promise<AppNotification> {
    return withStore((store) => {
      const notification: AppNotification = {
        id: createId(),
        read: false,
        createdAt: nowIso(),
        ...input,
      };
      store.notifications.unshift(notification);
      return notification;
    });
  },

  async listNotifications(userId: string): Promise<AppNotification[]> {
    return withStore((store) => store.notifications.filter((item) => item.userId === userId));
  },

  async unreadCount(userId: string): Promise<number> {
    return withStore(
      (store) => store.notifications.filter((item) => item.userId === userId && !item.read).length,
    );
  },

  async markNotificationRead(id: string, userId: string): Promise<AppNotification | undefined> {
    return withStore((store) => {
      const notification = store.notifications.find((item) => item.id === id && item.userId === userId);
      if (!notification) {
        return undefined;
      }
      notification.read = true;
      return notification;
    });
  },

  async writeAudit(input: Omit<AuditLog, "id" | "createdAt">): Promise<void> {
    await withStore((store) => {
      store.auditLogs.unshift({
        id: createId(),
        createdAt: nowIso(),
        ...input,
      });
    });
  },

  async listAuditLogs(): Promise<AuditLog[]> {
    return withStore((store) => store.auditLogs);
  },

  async getSettings(): Promise<PlatformSettings> {
    return withStore((store) => store.settings);
  },

  async saveSettings(settings: PlatformSettings): Promise<PlatformSettings> {
    return withStore((store) => {
      store.settings = settings;
      return settings;
    });
  },

  async overview(): Promise<PlatformOverview> {
    return withStore((store) => ({
      totalServices: store.services.length,
      activeServices: store.services.filter((item) => item.isActive).length,
      totalProjects: store.projects.length,
      publishedProjects: store.projects.filter((item) => item.isPublished).length,
      inquiries: store.inquiries.length,
      pendingOrders: store.orders.filter((item) => item.orderStatus === "pending").length,
      paidOrders: store.orders.filter((item) => item.paymentStatus === "paid").length,
      users: store.users.length,
    }));
  },
};

export interface PlatformOverview {
  totalServices: number;
  activeServices: number;
  totalProjects: number;
  publishedProjects: number;
  inquiries: number;
  pendingOrders: number;
  paidOrders: number;
  users: number;
}

export type PlatformRepository = typeof localRepository;
