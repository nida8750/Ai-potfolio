import { handleRoute, noStore } from "@/lib/api/route";
import { passThroughBackend, proxyBackend, requireUserBackendHeaders } from "@/lib/api/backend-bff";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return handleRoute(
    request,
    { action: "ai.knowledge.upload", rateLimit: { limit: 10, windowMs: 60_000 } },
    async () => {
      const headers = await requireUserBackendHeaders();
      const { id } = await context.params;
      const formData = await request.formData();
      const response = await proxyBackend({
        path: `/api/v1/knowledge-bases/${encodeURIComponent(id)}/documents`,
        method: "POST",
        headers,
        formData,
      });
      return noStore(await passThroughBackend(response));
    },
  );
}
