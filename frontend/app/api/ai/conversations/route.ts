import { z } from "zod";
import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { passThroughBackend, proxyBackend, requireUserBackendHeaders } from "@/lib/api/backend-bff";

const createSchema = z.object({
  title: z.string().max(200).optional(),
  agent_id: z.string().max(80).optional(),
});

export async function GET(request: Request) {
  return handleRoute(request, { action: "ai.conversations.list" }, async () => {
    const headers = await requireUserBackendHeaders();
    const response = await proxyBackend({ path: "/api/v1/conversations", headers });
    return noStore(await passThroughBackend(response));
  });
}

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "ai.conversations.create", rateLimit: { limit: 30, windowMs: 60_000 } },
    async () => {
      const headers = await requireUserBackendHeaders();
      const body = await parseBody(request, createSchema);
      const response = await proxyBackend({
        path: "/api/v1/conversations",
        method: "POST",
        headers,
        json: body,
      });
      return noStore(await passThroughBackend(response));
    },
  );
}
