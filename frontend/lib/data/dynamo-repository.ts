import "server-only";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoClient, dynamoTableName } from "@/lib/aws/dynamodb";
import { createId, nowIso } from "@/lib/data/ids";
import { defaultSettings } from "@/lib/data/seed";
import type { CredentialRecord } from "@/lib/data/local";
import type { PlatformOverview, PlatformRepository } from "@/lib/data/local-repository";
import type { AuditLog } from "@/types/audit";
import type { Inquiry, InquiryStatus } from "@/types/inquiry";
import type { AppNotification, NotificationType } from "@/types/notification";
import type { Order } from "@/types/order";
import type { PaymentRecord, ProcessedEvent } from "@/types/payment";
import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";
import type { PlatformSettings } from "@/types/settings";
import type { UserProfile } from "@/types/user";

/**
 * Single-table layout. `GSI1` lists an entity type newest-first, `GSI2` lists
 * the records owned by one user. See docs/aws-infrastructure.md for the table
 * definition these access patterns expect.
 */
interface Keys {
  pk: string;
  sk: string;
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
}

type Entity = "SERVICE" | "PROJECT" | "INQUIRY" | "ORDER" | "PAYMENT" | "USER";

function pad(value: number): string {
  return String(Math.max(0, Math.trunc(value))).padStart(6, "0");
}

async function put(item: Keys & Record<string, unknown>): Promise<void> {
  await dynamoClient().send(
    new PutCommand({ TableName: dynamoTableName(), Item: item }),
  );
}

async function get<T>(pk: string, sk: string): Promise<T | undefined> {
  const result = await dynamoClient().send(
    new GetCommand({ TableName: dynamoTableName(), Key: { pk, sk } }),
  );
  return result.Item as T | undefined;
}

async function queryIndex<T>(
  index: "GSI1" | "GSI2",
  partition: string,
  options?: { limit?: number },
): Promise<T[]> {
  const field = index === "GSI1" ? "gsi1pk" : "gsi2pk";
  const items: T[] = [];
  let startKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamoClient().send(
      new QueryCommand({
        TableName: dynamoTableName(),
        IndexName: index,
        KeyConditionExpression: "#pk = :pk",
        ExpressionAttributeNames: { "#pk": field },
        ExpressionAttributeValues: { ":pk": partition },
        ScanIndexForward: false,
        ExclusiveStartKey: startKey as Record<string, never> | undefined,
        Limit: options?.limit,
      }),
    );
    items.push(...((result.Items ?? []) as T[]));
    startKey = result.LastEvaluatedKey;
  } while (startKey && (!options?.limit || items.length < options.limit));

  return options?.limit ? items.slice(0, options.limit) : items;
}

async function queryPartition<T>(pk: string, skPrefix: string): Promise<T[]> {
  const result = await dynamoClient().send(
    new QueryCommand({
      TableName: dynamoTableName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: { ":pk": pk, ":sk": skPrefix },
      ScanIndexForward: false,
    }),
  );
  return (result.Items ?? []) as T[];
}

function strip<T extends object>(item: T | undefined): T | undefined {
  if (!item) {
    return undefined;
  }
  const clone = { ...item } as Record<string, unknown>;
  for (const key of ["pk", "sk", "gsi1pk", "gsi1sk", "gsi2pk", "gsi2sk", "entity"]) {
    delete clone[key];
  }
  return clone as T;
}

function stripAll<T extends object>(items: T[]): T[] {
  return items.map((item) => strip(item) as T);
}

function entityKeys(entity: Entity, id: string): Keys {
  return { pk: `${entity}#${id}`, sk: entity };
}

async function resolveAlias(alias: string): Promise<string | undefined> {
  const item = await get<{ targetId: string }>(alias, "ALIAS");
  return item?.targetId;
}

async function putAlias(alias: string, targetId: string): Promise<void> {
  await put({ pk: alias, sk: "ALIAS", targetId });
}

async function dropAlias(alias: string): Promise<void> {
  await dynamoClient().send(
    new DeleteCommand({ TableName: dynamoTableName(), Key: { pk: alias, sk: "ALIAS" } }),
  );
}

async function countIndex(partition: string): Promise<number> {
  const result = await dynamoClient().send(
    new QueryCommand({
      TableName: dynamoTableName(),
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": partition },
      Select: "COUNT",
    }),
  );
  return result.Count ?? 0;
}

function credentialsUnsupported(): never {
  throw new Error(
    "Password credentials are never stored in DynamoDB. Configure Cognito when DATA_STORE=dynamodb.",
  );
}

export const dynamoRepository: PlatformRepository = {
  async getUser(id) {
    return strip(await get<UserProfile>(`USER#${id}`, "USER"));
  },

  async getUserByEmail(email) {
    const id = await resolveAlias(`USER_EMAIL#${email.toLowerCase()}`);
    return id ? this.getUser(id) : undefined;
  },

  async listUsers() {
    return stripAll(await queryIndex<UserProfile>("GSI1", "USER"));
  },

  async createUser(input) {
    const timestamp = nowIso();
    const user: UserProfile = {
      ...input,
      email: input.email.toLowerCase(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await put({
      ...entityKeys("USER", user.id),
      gsi1pk: "USER",
      gsi1sk: timestamp,
      entity: "USER",
      ...user,
    });
    await putAlias(`USER_EMAIL#${user.email}`, user.id);
    return user;
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
    await put({
      ...entityKeys("USER", id),
      gsi1pk: "USER",
      gsi1sk: current.createdAt,
      entity: "USER",
      ...next,
    });
    return next;
  },

  async countUsers() {
    return countIndex("USER");
  },

  async getCredential(): Promise<CredentialRecord | undefined> {
    return credentialsUnsupported();
  },

  async putCredential(): Promise<void> {
    return credentialsUnsupported();
  },

  async listServices(options) {
    const items = stripAll(await queryIndex<StoredService>("GSI1", "SERVICE"));
    const filtered = options?.activeOnly ? items.filter((item) => item.isActive) : items;
    return filtered.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
    );
  },

  async getService(id) {
    return strip(await get<StoredService>(`SERVICE#${id}`, "SERVICE"));
  },

  async getServiceBySlug(slug) {
    const id = await resolveAlias(`SERVICE_SLUG#${slug}`);
    return id ? this.getService(id) : undefined;
  },

  async saveService(service) {
    const previous = await this.getService(service.id);
    if (previous && previous.slug !== service.slug) {
      await dropAlias(`SERVICE_SLUG#${previous.slug}`);
    }
    await put({
      ...entityKeys("SERVICE", service.id),
      gsi1pk: "SERVICE",
      gsi1sk: `${pad(service.sortOrder)}#${service.createdAt}`,
      entity: "SERVICE",
      ...service,
    });
    await putAlias(`SERVICE_SLUG#${service.slug}`, service.id);
    return service;
  },

  async deleteService(id) {
    const existing = await this.getService(id);
    if (!existing) {
      return false;
    }
    await dynamoClient().send(
      new DeleteCommand({
        TableName: dynamoTableName(),
        Key: { pk: `SERVICE#${id}`, sk: "SERVICE" },
      }),
    );
    await dropAlias(`SERVICE_SLUG#${existing.slug}`);
    return true;
  },

  async listProjects(options) {
    const items = stripAll(await queryIndex<StoredProject>("GSI1", "PROJECT"));
    const filtered = options?.publishedOnly
      ? items.filter((item) => item.isPublished)
      : items;
    return filtered.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
    );
  },

  async getProject(id) {
    return strip(await get<StoredProject>(`PROJECT#${id}`, "PROJECT"));
  },

  async getProjectBySlug(slug) {
    const id = await resolveAlias(`PROJECT_SLUG#${slug}`);
    return id ? this.getProject(id) : undefined;
  },

  async saveProject(project) {
    const previous = await this.getProject(project.id);
    if (previous && previous.slug !== project.slug) {
      await dropAlias(`PROJECT_SLUG#${previous.slug}`);
    }
    await put({
      ...entityKeys("PROJECT", project.id),
      gsi1pk: "PROJECT",
      gsi1sk: `${pad(project.sortOrder)}#${project.createdAt}`,
      entity: "PROJECT",
      ...project,
    });
    await putAlias(`PROJECT_SLUG#${project.slug}`, project.id);
    return project;
  },

  async deleteProject(id) {
    const existing = await this.getProject(id);
    if (!existing) {
      return false;
    }
    await dynamoClient().send(
      new DeleteCommand({
        TableName: dynamoTableName(),
        Key: { pk: `PROJECT#${id}`, sk: "PROJECT" },
      }),
    );
    await dropAlias(`PROJECT_SLUG#${existing.slug}`);
    return true;
  },

  async createInquiry(input) {
    const timestamp = nowIso();
    const inquiry: Inquiry = {
      ...input,
      id: createId(),
      status: (input.status ?? "new") as InquiryStatus,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await put({
      ...entityKeys("INQUIRY", inquiry.id),
      gsi1pk: "INQUIRY",
      gsi1sk: timestamp,
      gsi2pk: inquiry.userId ? `USER#${inquiry.userId}#INQUIRY` : undefined,
      gsi2sk: inquiry.userId ? timestamp : undefined,
      entity: "INQUIRY",
      ...inquiry,
    });
    return inquiry;
  },

  async listInquiries(userId) {
    const items = userId
      ? await queryIndex<Inquiry>("GSI2", `USER#${userId}#INQUIRY`)
      : await queryIndex<Inquiry>("GSI1", "INQUIRY");
    return stripAll(items);
  },

  async getInquiry(id) {
    return strip(await get<Inquiry>(`INQUIRY#${id}`, "INQUIRY"));
  },

  async updateInquiry(id, patch) {
    const current = await this.getInquiry(id);
    if (!current) {
      return undefined;
    }
    const next: Inquiry = { ...current, ...patch, id: current.id, updatedAt: nowIso() };
    await put({
      ...entityKeys("INQUIRY", id),
      gsi1pk: "INQUIRY",
      gsi1sk: current.createdAt,
      gsi2pk: next.userId ? `USER#${next.userId}#INQUIRY` : undefined,
      gsi2sk: next.userId ? current.createdAt : undefined,
      entity: "INQUIRY",
      ...next,
    });
    return next;
  },

  async createOrder(input) {
    const timestamp = nowIso();
    const order: Order = { ...input, id: createId(), createdAt: timestamp, updatedAt: timestamp };
    await put({
      ...entityKeys("ORDER", order.id),
      gsi1pk: "ORDER",
      gsi1sk: timestamp,
      gsi2pk: `USER#${order.userId}#ORDER`,
      gsi2sk: timestamp,
      entity: "ORDER",
      ...order,
    });
    return order;
  },

  async listOrders(userId) {
    const items = userId
      ? await queryIndex<Order>("GSI2", `USER#${userId}#ORDER`)
      : await queryIndex<Order>("GSI1", "ORDER");
    return stripAll(items);
  },

  async getOrder(id) {
    return strip(await get<Order>(`ORDER#${id}`, "ORDER"));
  },

  async getOrderByProviderOrderId(provider, providerOrderId) {
    const id = await resolveAlias(`ORDER_PROVIDER#${provider}#${providerOrderId}`);
    return id ? this.getOrder(id) : undefined;
  },

  async updateOrder(id, patch) {
    const current = await this.getOrder(id);
    if (!current) {
      return undefined;
    }
    const next: Order = { ...current, ...patch, id: current.id, updatedAt: nowIso() };
    await put({
      ...entityKeys("ORDER", id),
      gsi1pk: "ORDER",
      gsi1sk: current.createdAt,
      gsi2pk: `USER#${next.userId}#ORDER`,
      gsi2sk: current.createdAt,
      entity: "ORDER",
      ...next,
    });
    if (next.paymentProvider && next.providerOrderId) {
      await putAlias(
        `ORDER_PROVIDER#${next.paymentProvider}#${next.providerOrderId}`,
        next.id,
      );
    }
    return next;
  },

  async createPayment(input) {
    const timestamp = nowIso();
    const payment: PaymentRecord = {
      ...input,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await put({
      ...entityKeys("PAYMENT", payment.id),
      gsi1pk: "PAYMENT",
      gsi1sk: timestamp,
      gsi2pk: `USER#${payment.userId}#PAYMENT`,
      gsi2sk: timestamp,
      entity: "PAYMENT",
      ...payment,
    });
    if (payment.eventId) {
      await putAlias(`PAYMENT_EVENT#${payment.provider}#${payment.eventId}`, payment.id);
    }
    return payment;
  },

  async listPayments(userId) {
    const items = userId
      ? await queryIndex<PaymentRecord>("GSI2", `USER#${userId}#PAYMENT`)
      : await queryIndex<PaymentRecord>("GSI1", "PAYMENT");
    return stripAll(items);
  },

  async getPayment(id) {
    return strip(await get<PaymentRecord>(`PAYMENT#${id}`, "PAYMENT"));
  },

  async getPaymentByEvent(provider, eventId) {
    const id = await resolveAlias(`PAYMENT_EVENT#${provider}#${eventId}`);
    return id ? this.getPayment(id) : undefined;
  },

  async updatePayment(id, patch) {
    const current = await this.getPayment(id);
    if (!current) {
      return undefined;
    }
    const next: PaymentRecord = { ...current, ...patch, id: current.id, updatedAt: nowIso() };
    await put({
      ...entityKeys("PAYMENT", id),
      gsi1pk: "PAYMENT",
      gsi1sk: current.createdAt,
      gsi2pk: `USER#${next.userId}#PAYMENT`,
      gsi2sk: current.createdAt,
      entity: "PAYMENT",
      ...next,
    });
    if (next.eventId) {
      await putAlias(`PAYMENT_EVENT#${next.provider}#${next.eventId}`, next.id);
    }
    return next;
  },

  async hasProcessedEvent(provider, eventId) {
    const item = await get<ProcessedEvent>(`EVENT#${provider}#${eventId}`, "EVENT");
    return Boolean(item);
  },

  async recordProcessedEvent(provider, eventId) {
    try {
      await dynamoClient().send(
        new PutCommand({
          TableName: dynamoTableName(),
          Item: {
            pk: `EVENT#${provider}#${eventId}`,
            sk: "EVENT",
            id: createId(),
            provider,
            eventId,
            createdAt: nowIso(),
          },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
    } catch (error) {
      if ((error as { name?: string }).name !== "ConditionalCheckFailedException") {
        throw error;
      }
    }
  },

  async createNotification(input) {
    const timestamp = nowIso();
    const notification: AppNotification = {
      id: createId(),
      read: false,
      createdAt: timestamp,
      ...input,
      type: input.type as NotificationType,
    };
    await put({
      pk: `USER#${notification.userId}`,
      sk: `NOTIFICATION#${timestamp}#${notification.id}`,
      entity: "NOTIFICATION",
      ...notification,
    });
    return notification;
  },

  async listNotifications(userId) {
    return stripAll(
      await queryPartition<AppNotification>(`USER#${userId}`, "NOTIFICATION#"),
    );
  },

  async unreadCount(userId) {
    const items = await this.listNotifications(userId);
    return items.filter((item) => !item.read).length;
  },

  async markNotificationRead(id, userId) {
    const items = await queryPartition<AppNotification & { sk: string }>(
      `USER#${userId}`,
      "NOTIFICATION#",
    );
    const match = items.find((item) => item.id === id);
    if (!match) {
      return undefined;
    }
    await dynamoClient().send(
      new UpdateCommand({
        TableName: dynamoTableName(),
        Key: { pk: `USER#${userId}`, sk: match.sk },
        UpdateExpression: "SET #read = :read",
        ExpressionAttributeNames: { "#read": "read" },
        ExpressionAttributeValues: { ":read": true },
      }),
    );
    return { ...(strip(match) as AppNotification), read: true };
  },

  async writeAudit(input) {
    const timestamp = nowIso();
    const id = createId();
    await put({
      pk: "AUDIT",
      sk: `${timestamp}#${id}`,
      entity: "AUDIT",
      id,
      createdAt: timestamp,
      ...input,
    });
  },

  async listAuditLogs() {
    return stripAll(await queryPartition<AuditLog>("AUDIT", ""));
  },

  async getSettings() {
    const stored = strip(await get<PlatformSettings>("SETTINGS", "PLATFORM"));
    return stored ?? defaultSettings();
  },

  async saveSettings(settings) {
    await put({ pk: "SETTINGS", sk: "PLATFORM", entity: "SETTINGS", ...settings });
    return settings;
  },

  async overview(): Promise<PlatformOverview> {
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
