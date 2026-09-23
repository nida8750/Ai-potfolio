import { handleRoute, noStore } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { internalBackendHeaders, passThroughBackend, proxyBackend } from "@/lib/api/backend-bff";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.ai.dashboard" }, async () => {
    await requireAdmin();
    const headers = internalBackendHeaders();
    const response = await proxyBackend({ path: "/api/v1/internal/dashboard", headers });
    return noStore(await passThroughBackend(response));
  });
}
