import { z } from "zod";
import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { passThroughBackend, proxyBackend, requireUserBackendHeaders } from "@/lib/api/backend-bff";

const messageSchema = z.object({
  content: z.string().min(1).max(8000),
  agent_id: z.string().max(80).optional(),
  stream: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return handleRoute(
    request,
    { action: "ai.conversations.message", rateLimit: { limit: 40, windowMs: 60_000 } },
    async () => {
      const headers = await requireUserBackendHeaders();
      const { id } = await context.params;
      const body = await parseBody(request, messageSchema);
      const response = await proxyBackend({
        path: `/api/v1/conversations/${encodeURIComponent(id)}/messages`,
        method: "POST",
        headers,
        json: body,
      });
      return noStore(await passThroughBackend(response));
    },
  );
}
