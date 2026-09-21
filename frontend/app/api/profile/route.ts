import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { toPublicUser } from "@/lib/data/presenters";
import { repository } from "@/lib/data/repository";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { sanitizeText } from "@/lib/security/sanitize";
import { profileUpdateSchema } from "@/lib/validation/auth";

export async function GET(request: Request) {
  return handleRoute(request, { action: "profile.read" }, async () => {
    const auth = await requireAuth();
    const profile = await repository.getUser(auth.id);
    if (!profile) {
      return jsonError("NOT_FOUND", "Profile not found.", 404);
    }
    return noStore(jsonSuccess({ profile: toPublicUser(profile) }));
  });
}

export async function PATCH(request: Request) {
  return handleRoute(
    request,
    { action: "profile.update", rateLimit: { limit: 20, windowMs: 10 * 60 * 1000 } },
    async () => {
      const auth = await requireAuth();
      const input = await parseBody(request, profileUpdateSchema);

      const updated = await repository.updateUser(auth.id, {
        name: sanitizeText(input.name),
        phone: input.phone ? sanitizeText(input.phone) : undefined,
      });

      if (!updated) {
        return jsonError("NOT_FOUND", "Profile not found.", 404);
      }

      return jsonSuccess({ profile: toPublicUser(updated) });
    },
  );
}
