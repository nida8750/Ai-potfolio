import { handleRoute, noStore } from "@/lib/api/route";
import { backendInternalGet, fetchBackendHealth } from "@/lib/api/backend-health";
import { integrationStatus } from "@/lib/integrations";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "ai.integration" }, async () => {
    const frontend = integrationStatus();
    const fastapi = await fetchBackendHealth();
    const agents = fastapi.reachable
      ? await backendInternalGet<{ agents?: unknown[]; tools?: unknown[] }>(
          "/api/v1/internal/agents",
        )
      : null;
    return noStore(
      jsonSuccess({
        stack: ["Next.js", "FastAPI", "Supabase", "LangGraph", "RAG", "n8n"],
        frontend,
        fastapi,
        agents: agents?.agents ?? [],
      }),
    );
  });
}
