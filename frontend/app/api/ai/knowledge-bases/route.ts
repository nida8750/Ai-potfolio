import { z } from "zod";
import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { passThroughBackend, proxyBackend, requireUserBackendHeaders } from "@/lib/api/backend-bff";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  return handleRoute(request, { action: "ai.knowledge.list" }, async () => {
    const headers = await requireUserBackendHeaders();
    const response = await proxyBackend({ path: "/api/v1/knowledge-bases", headers });
    return noStore(await passThroughBackend(response));
  });
}

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "ai.knowledge.create", rateLimit: { limit: 20, windowMs: 60_000 } },
    async () => {
      const headers = await requireUserBackendHeaders();
      const body = await parseBody(request, createSchema);
      const response = await proxyBackend({
        path: "/api/v1/knowledge-bases",
        method: "POST",
        headers,
        json: body,
      });
      return noStore(await passThroughBackend(response));
    },
  );
}
