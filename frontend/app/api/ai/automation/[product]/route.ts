import { z } from "zod";
import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { passThroughBackend, proxyBackend, requireUserBackendHeaders } from "@/lib/api/backend-bff";

const triggerSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  idempotency_key: z.string().max(120).optional(),
});

type RouteContext = { params: Promise<{ product: string }> };

export async function GET(request: Request, context: RouteContext) {
  return handleRoute(request, { action: "ai.automation.get" }, async () => {
    const headers = await requireUserBackendHeaders();
    const { product } = await context.params;
    const path =
      product === "products"
        ? "/api/v1/automation/products"
        : product === "runs"
          ? "/api/v1/automation/runs"
          : `/api/v1/automation/${encodeURIComponent(product)}`;
    const response = await proxyBackend({ path, headers });
    return noStore(await passThroughBackend(response));
  });
}

export async function POST(request: Request, context: RouteContext) {
  return handleRoute(
    request,
    { action: "ai.automation.trigger", rateLimit: { limit: 20, windowMs: 60_000 } },
    async () => {
      const headers = await requireUserBackendHeaders();
      const { product } = await context.params;
      const body = await parseBody(request, triggerSchema);
      const response = await proxyBackend({
        path: `/api/v1/automation/${encodeURIComponent(product)}`,
        method: "POST",
        headers,
        json: body,
      });
      return noStore(await passThroughBackend(response));
    },
  );
}
