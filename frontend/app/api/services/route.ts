import { handleRoute, noStore } from "@/lib/api/route";
import { repository } from "@/lib/data/repository";
import { toPublicService } from "@/lib/data/presenters";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "services.list" }, async () => {
    const services = await repository.listServices({ activeOnly: true });
    return noStore(jsonSuccess({ services: services.map(toPublicService) }));
  });
}
