import { handleRoute, noStore } from "@/lib/api/route";
import { passThroughBackend, proxyBackend, requireUserBackendHeaders } from "@/lib/api/backend-bff";

export async function GET(request: Request) {
  return handleRoute(request, { action: "ai.dashboard" }, async () => {
    const headers = await requireUserBackendHeaders();
    const response = await proxyBackend({ path: "/api/v1/dashboard/overview", headers });
    return noStore(await passThroughBackend(response));
  });
}
