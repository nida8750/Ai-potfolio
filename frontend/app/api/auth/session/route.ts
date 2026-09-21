import { handleRoute, noStore } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/auth/server";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "auth.session" }, async () => {
    const user = await getCurrentUser();
    return noStore(jsonSuccess({ user }));
  });
}
