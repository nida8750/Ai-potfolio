import { handleRoute, noStore } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.orders.list" }, async () => {
    await requireAdmin();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("q")?.toLowerCase().trim();

    let orders = await repository.listOrders();
    if (status) {
      orders = orders.filter((order) => order.orderStatus === status);
    }
    if (search) {
      orders = orders.filter(
        (order) =>
          order.id.includes(search) ||
          order.customerEmail.toLowerCase().includes(search) ||
          order.customerName.toLowerCase().includes(search),
      );
    }

    return noStore(jsonSuccess({ orders }));
  });
}
