import { z } from "zod";
import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { nowIso } from "@/lib/data/ids";
import { repository } from "@/lib/data/repository";
import { env } from "@/lib/env";
import { configuredProviders } from "@/lib/payments";
import { jsonSuccess } from "@/lib/security/http";
import { currencySchema } from "@/lib/validation/common";

const settingsSchema = z.object({
  defaultCurrency: currencySchema,
  paymentProvider: z.enum(["stripe", "paypal", "none"]),
  bookingsEnabled: z.boolean(),
});

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.settings.read" }, async () => {
    await requireAdmin();
    const settings = await repository.getSettings();
    return noStore(
      jsonSuccess({
        settings,
        supportedCurrencies: env.supportedCurrencies,
        configuredProviders: configuredProviders(),
      }),
    );
  });
}

export async function PUT(request: Request) {
  return handleRoute(request, { action: "admin.settings.update" }, async () => {
    const admin = await requireAdmin();
    const input = await parseBody(request, settingsSchema);

    const settings = await repository.saveSettings({
      id: "platform",
      defaultCurrency: input.defaultCurrency,
      paymentProvider: input.paymentProvider,
      bookingsEnabled: input.bookingsEnabled,
      updatedAt: nowIso(),
      updatedBy: admin.id,
    });

    await repository.writeAudit({
      actorId: admin.id,
      action: "settings.update",
      entityType: "SETTINGS",
      entityId: "platform",
      metadata: {
        defaultCurrency: settings.defaultCurrency,
        paymentProvider: settings.paymentProvider,
        bookingsEnabled: settings.bookingsEnabled,
      },
    });

    return jsonSuccess({ settings });
  });
}
