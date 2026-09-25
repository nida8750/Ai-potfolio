import { handleRoute, parseBody } from "@/lib/api/route";
import { signInAdmin } from "@/lib/auth/server";
import { loginSchema } from "@/lib/validation/auth";
import { jsonSuccess } from "@/lib/security/http";
import { logEvent } from "@/lib/security/logger";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "auth.admin_login", rateLimit: { limit: 8, windowMs: 10 * 60 * 1000 } },
    async ({ requestId }) => {
      const input = await parseBody(request, loginSchema);
      const user = await signInAdmin(input.email, input.password);
      logEvent({ requestId, action: "auth.admin_login", result: "ok", userId: user.id });
      return jsonSuccess({ user });
    },
  );
}
