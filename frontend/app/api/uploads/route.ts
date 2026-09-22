import { z } from "zod";
import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAdmin, requireAuth } from "@/lib/auth/server";
import { isStorageConfigured } from "@/lib/env";
import { presignUpload } from "@/lib/storage";
import { jsonError, jsonSuccess } from "@/lib/security/http";

const uploadSchema = z.object({
  folder: z.enum(["avatars", "projects", "documents"]),
  contentType: z.string().trim().min(3).max(120),
  byteSize: z.number().int().positive().max(8 * 1024 * 1024),
});

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "uploads.presign", rateLimit: { limit: 20, windowMs: 10 * 60 * 1000 } },
    async () => {
      const auth = await requireAuth();
      const input = await parseBody(request, uploadSchema);

      // Project and document assets are admin-owned; avatars belong to the
      // signed-in user.
      if (input.folder !== "avatars") {
        await requireAdmin();
      }

      if (!isStorageConfigured()) {
        return jsonError(
          "STORAGE_UNAVAILABLE",
          "File storage is not configured, so uploads are disabled.",
          503,
        );
      }

      try {
        // The object key is generated server-side; the client filename is
        // never used to build it.
        const result = await presignUpload({
          userId: auth.id,
          folder: input.folder,
          contentType: input.contentType,
          byteSize: input.byteSize,
        });
        return jsonSuccess(result);
      } catch (error) {
        if (error instanceof Error && /not allowed|too large/i.test(error.message)) {
          return jsonError("INVALID_FILE", error.message, 422);
        }
        throw error;
      }
    },
  );
}
