import { handleRoute } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { jsonError, jsonSuccess } from "@/lib/security/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "notifications.read" }, async () => {
    const auth = await requireAuth();
    const { id } = await params;

    // Scoped by the session user id so one account cannot touch another's rows.
    const notification = await repository.markNotificationRead(id, auth.id);
    if (!notification) {
      return jsonError("NOT_FOUND", "Notification not found.", 404);
    }
    return jsonSuccess({ notification });
  });
}
