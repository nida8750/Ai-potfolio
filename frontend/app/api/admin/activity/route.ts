import { handleRoute, noStore } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.activity.list" }, async () => {
    await requireAdmin();
    const logs = await repository.listAuditLogs();
    return noStore(jsonSuccess({ logs: logs.slice(0, 200) }));
  });
}
