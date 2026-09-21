import "server-only";
import { env, isDynamoConfigured } from "@/lib/env";
import { localRepository } from "@/lib/data/local-repository";
import { dynamoRepository } from "@/lib/data/dynamo-repository";
import type { PlatformOverview, PlatformRepository } from "@/lib/data/local-repository";
import type { OrderStatus } from "@/types/order";
import type { UserRole } from "@/types/user";

export type { PlatformOverview, PlatformRepository };

function selectRepository(): PlatformRepository {
  if (env.dataStore !== "dynamodb") {
    return localRepository;
  }
  if (!isDynamoConfigured()) {
    throw new Error(
      "DATA_STORE=dynamodb requires AWS_REGION and DYNAMODB_TABLE_NAME to be set.",
    );
  }
  return dynamoRepository;
}

let cached: PlatformRepository | undefined;

export const repository = new Proxy({} as PlatformRepository, {
  get(_target, property: string | symbol) {
    cached ??= selectRepository();
    return Reflect.get(cached, property, cached);
  },
});

export function activeDataStore(): "local" | "dynamodb" {
  return env.dataStore === "dynamodb" ? "dynamodb" : "local";
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
