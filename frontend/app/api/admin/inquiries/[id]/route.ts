import { z } from "zod";
import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { onInquiryStatusChanged } from "@/lib/n8n/events";
import { jsonError, jsonSuccess } from "@/lib/security/http";

const inquiryPatchSchema = z.object({
  status: z.enum(["new", "in_progress", "completed", "closed"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "admin.inquiries.update" }, async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const patch = await parseBody(request, inquiryPatchSchema);

    const current = await repository.getInquiry(id);
    const inquiry = await repository.updateInquiry(id, { status: patch.status });
    if (!inquiry) {
      return jsonError("NOT_FOUND", "Inquiry not found.", 404);
    }

    if (current && current.status !== inquiry.status) {
      await onInquiryStatusChanged(inquiry, current.status);
    }

    await repository.writeAudit({
      actorId: admin.id,
      action: "inquiry.status_change",
      entityType: "INQUIRY",
      entityId: id,
      metadata: { status: patch.status },
    });

    return jsonSuccess({ inquiry });
  });
}
