import { handleRoute, noStore } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { configuredProviders } from "@/lib/payments";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.payments.list" }, async () => {
    await requireAdmin();
    const payments = await repository.listPayments();

    // Only provider references are stored and returned; card data never
    // reaches this application.
    return noStore(
      jsonSuccess({ payments, refundableProviders: configuredProviders() }),
    );
  });
}
