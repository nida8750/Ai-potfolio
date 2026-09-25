import { z } from "zod";
import { handleRoute, noStore } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { isAutomationProductId } from "@/data/automations";
import { repository } from "@/lib/data/repository";
import { isN8nConfigured } from "@/lib/env";
import { onInquiryCreated } from "@/lib/n8n/events";
import { dispatchAutomationProduct } from "@/lib/n8n/products";
import { jsonError, jsonSuccess } from "@/lib/security/http";

type RouteContext = { params: Promise<{ product: string }> };

const triggerSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  persistLead: z.boolean().optional(),
});

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Authenticated trigger → persist when needed → POST the product webhook URL. */
export async function POST(request: Request, context: RouteContext) {
  return handleRoute(
    request,
    {
      action: "automations.trigger",
      rateLimit: { limit: 20, windowMs: 60 * 1000 },
    },
    async () => {
      const auth = await requireAuth();
      const { product: raw } = await context.params;
      const product = raw.trim().toLowerCase();
      if (!isAutomationProductId(product)) {
        return jsonError("VALIDATION_ERROR", "Unknown automation product.", 422);
      }

      let body: z.infer<typeof triggerSchema> = {};
      try {
        body = triggerSchema.parse(await request.json());
      } catch {
        body = {};
      }

      const userPayload = body.payload ?? {};
      let inquiryId: string | undefined;

      if (product === "leadflow" && body.persistLead !== false) {
        const email = asString(userPayload.email) ?? auth.email;
        const name = asString(userPayload.name) ?? auth.name ?? "Automation user";
        if (email.includes("@")) {
          const inquiry = await repository.createInquiry({
            userId: auth.id,
            name,
            email: email.toLowerCase(),
            phone: asString(userPayload.phone),
            message:
              asString(userPayload.message) ?? `LeadFlow trigger for ${product}.`,
            subject: "LeadFlow automation",
            source: "service_request",
          });
          inquiryId = inquiry.id;
          await onInquiryCreated(inquiry);
        }
      }

      const dispatch = await dispatchAutomationProduct(product, {
        ...userPayload,
        triggeredBy: auth.id,
        inquiryId,
      });

      return noStore(
        jsonSuccess({
          product,
          inquiryId: inquiryId ?? null,
          automationConfigured: isN8nConfigured(),
          dispatch,
        }),
      );
    },
  );
}
