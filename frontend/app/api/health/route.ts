import { handleRoute, noStore } from "@/lib/api/route";
import { fetchBackendHealth } from "@/lib/api/backend-health";
import { integrationStatus } from "@/lib/integrations";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "health.get" }, async () => {
    const frontend = integrationStatus();
    const fastapi = await fetchBackendHealth();
    return noStore(
      jsonSuccess({
        ok: true,
        ...frontend,
        fastapi,
      }),
    );
  });
}
