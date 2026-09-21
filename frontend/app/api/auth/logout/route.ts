import { handleRoute } from "@/lib/api/route";
import { signOutUser } from "@/lib/auth/server";
import { jsonSuccess } from "@/lib/security/http";

export async function POST(request: Request) {
  return handleRoute(request, { action: "auth.logout" }, async () => {
    await signOutUser();
    return jsonSuccess({ signedOut: true });
  });
}
