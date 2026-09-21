import { handleRoute, noStore } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.users.list" }, async () => {
    await requireAdmin();
    const users = await repository.listUsers();

    // Credentials live in Cognito (or the local dev credential store) and are
    // never exposed through this endpoint.
    return noStore(
      jsonSuccess({
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        })),
      }),
    );
  });
}
