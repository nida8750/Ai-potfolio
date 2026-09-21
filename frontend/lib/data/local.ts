import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { catalogProjects, catalogServices, defaultSettings } from "@/lib/data/seed";
import type { AuditLog } from "@/types/audit";
import type { Inquiry } from "@/types/inquiry";
import type { AppNotification } from "@/types/notification";
import type { Order } from "@/types/order";
import type { PaymentRecord, ProcessedEvent } from "@/types/payment";
import type { StoredProject } from "@/types/project";
import type { StoredService } from "@/types/service";
import type { PlatformSettings } from "@/types/settings";
import type { UserProfile } from "@/types/user";

export interface CredentialRecord {
  userId: string;
  email: string;
  passwordHash: string;
  verified: boolean;
  verificationHash?: string;
  resetHash?: string;
  resetExpiresAt?: string;
}

export interface StoreShape {
  users: UserProfile[];
  credentials: CredentialRecord[];
  services: StoredService[];
  projects: StoredProject[];
  inquiries: Inquiry[];
  orders: Order[];
  payments: PaymentRecord[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  processedEvents: ProcessedEvent[];
  settings: PlatformSettings;
}

// Overridable so tests can point at a throwaway file instead of dev data.
const FILE =
  process.env.LOCAL_STORE_PATH?.trim() ||
  path.join(process.cwd(), ".data", "store.json");

let queue: Promise<void> = Promise.resolve();

function emptyStore(): StoreShape {
  return {
    users: [],
    credentials: [],
    services: catalogServices(),
    projects: catalogProjects(),
    inquiries: [],
    orders: [],
    payments: [],
    notifications: [],
    auditLogs: [],
    processedEvents: [],
    settings: defaultSettings(),
  };
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      ...emptyStore(),
      ...parsed,
    };
  } catch {
    const initial = emptyStore();
    await persist(initial);
    return initial;
  }
}

async function persist(store: StoreShape): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export function withStore<T>(fn: (store: StoreShape) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await persist(store);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function readOnlyStore(): Promise<StoreShape> {
  return withStore(async (store) => structuredClone(store));
}
