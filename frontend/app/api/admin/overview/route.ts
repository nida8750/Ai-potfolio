import { handleRoute, noStore } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { integrationStatus } from "@/lib/integrations";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.overview" }, async () => {
    await requireAdmin();

    // Every number below is counted from stored records, so an empty platform
    // reports zeros rather than invented figures.
    const overview = await repository.overview();

    return noStore(
      jsonSuccess({
        overview,
        integrations: integrationStatus(),
      }),
    );
  });
}
