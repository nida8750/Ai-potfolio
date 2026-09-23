import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { passThroughBackend, proxyBackend, requireUserBackendHeaders } from "@/lib/api/backend-bff";
import { z } from "zod";

const runSchema = z.object({
  message: z.string().min(1).max(8000),
});

export async function GET(request: Request) {
  return handleRoute(request, { action: "ai.agents.list" }, async () => {
    const headers = await requireUserBackendHeaders();
    const response = await proxyBackend({ path: "/api/v1/agents", headers });
    return noStore(await passThroughBackend(response));
  });
}

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "ai.agents.run", rateLimit: { limit: 20, windowMs: 60_000 } },
    async () => {
      const headers = await requireUserBackendHeaders();
      const body = await parseBody(request, runSchema);
      const agentId = new URL(request.url).searchParams.get("id") ?? "supervisor";
      const response = await proxyBackend({
        path: `/api/v1/agents/${encodeURIComponent(agentId)}/run`,
        method: "POST",
        headers,
        json: body,
      });
      return noStore(await passThroughBackend(response));
    },
  );
}
