import "server-only";
import { activeDataStore as resolveStore, isDynamoConfigured, isSupabaseConfigured } from "@/lib/env";
import { dynamoRepository } from "@/lib/data/dynamo-repository";
import { localRepository } from "@/lib/data/local-repository";
import { supabaseRepository } from "@/lib/data/supabase-repository";
import { logEvent } from "@/lib/security/logger";
import type { PlatformOverview, PlatformRepository } from "@/lib/data/local-repository";
import type { OrderStatus } from "@/types/order";
import type { UserRole } from "@/types/user";

export type { PlatformOverview, PlatformRepository };

let warnedFallback = false;

function selectRepository(): PlatformRepository {
  const store = resolveStore();
  if (store === "dynamodb") {
    if (!isDynamoConfigured()) {
      throw new Error(
        "DATA_STORE=dynamodb requires AWS_REGION and DYNAMODB_TABLE_NAME to be set.",
      );
    }
    return dynamoRepository;
  }
  if (store === "supabase") {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "DATA_STORE=supabase requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    return supabaseRepository;
  }
  if (!warnedFallback) {
    warnedFallback = true;
    logEvent({
      action: "data.store",
      result: "ok",
      metadata: {
        store: "local",
        reason: "supabase_keys_missing",
        missing: [
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "DATABASE_URL password",
        ],
      },
    });
  }
  return localRepository;
}

let cached: PlatformRepository | undefined;

export const repository = new Proxy({} as PlatformRepository, {
  get(_target, property: string | symbol) {
    cached ??= selectRepository();
    return Reflect.get(cached, property, cached);
  },
});

export function activeDataStore(): "local" | "supabase" | "dynamodb" {
  return resolveStore();
}

export async function nextUserRole(): Promise<UserRole> {
  const count = await repository.countUsers();
  return count === 0 ? "ADMIN" : "USER";
}

export const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return allowedOrderTransitions[from].includes(to);
}
