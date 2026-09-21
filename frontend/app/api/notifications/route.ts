import { handleRoute, noStore } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "notifications.list" }, async () => {
    const auth = await requireAuth();
    const notifications = await repository.listNotifications(auth.id);
    return noStore(
      jsonSuccess({
        notifications,
        unread: notifications.filter((item) => !item.read).length,
      }),
    );
  });
}
