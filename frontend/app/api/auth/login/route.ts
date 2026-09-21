import { handleRoute, parseBody } from "@/lib/api/route";
import { signIn } from "@/lib/auth/server";
import { loginSchema } from "@/lib/validation/auth";
import { jsonSuccess } from "@/lib/security/http";
import { logEvent } from "@/lib/security/logger";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "auth.login", rateLimit: { limit: 10, windowMs: 10 * 60 * 1000 } },
    async ({ requestId }) => {
      const input = await parseBody(request, loginSchema);
      const user = await signIn(input.email, input.password);
      logEvent({ requestId, action: "auth.login", result: "ok", userId: user.id });
      return jsonSuccess({ user });
    },
  );
}
