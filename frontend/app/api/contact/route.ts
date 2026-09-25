import { handleRoute, parseBody } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { onInquiryCreated } from "@/lib/n8n/events";
import { isN8nConfigured } from "@/lib/env";
import { jsonSuccess } from "@/lib/security/http";
import { logEvent } from "@/lib/security/logger";
import { sanitizeMultiline, sanitizeText } from "@/lib/security/sanitize";
import { contactSchema } from "@/lib/validation/contact";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "contact.create", rateLimit: { limit: 5, windowMs: 10 * 60 * 1000 } },
    async ({ requestId }) => {
      const input = await parseBody(request, contactSchema);
      const user = await getCurrentUser();

      const service = input.serviceId
        ? await repository.getService(input.serviceId)
        : undefined;

      // The inquiry is persisted before automation runs, so a failing or
      // unconfigured n8n workflow can never drop a customer message.
      const inquiry = await repository.createInquiry({
        userId: user?.id,
        name: sanitizeText(input.name),
        email: input.email.toLowerCase(),
        phone: input.phone ? sanitizeText(input.phone) : undefined,
        serviceId: service?.id,
        subject: service ? `Service inquiry: ${service.title}` : "General inquiry",
        message: sanitizeMultiline(input.message),
        source: service ? "service_request" : "contact",
      });

      logEvent({ requestId, action: "contact.create", result: "ok", userId: user?.id });

      const { replySent } = await onInquiryCreated(inquiry);

      return jsonSuccess(
        {
          inquiryId: inquiry.id,
          stored: true,
          replySent,
          automationConfigured: isN8nConfigured(),
        },
        201,
      );
    },
  );
}
