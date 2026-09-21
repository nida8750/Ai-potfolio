import { handleRoute, parseBody } from "@/lib/api/route";
import { forgotPassword } from "@/lib/auth/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { isProduction } from "@/lib/env";
import { jsonSuccess } from "@/lib/security/http";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "auth.forgot_password", rateLimit: { limit: 5, windowMs: 15 * 60 * 1000 } },
    async () => {
      const input = await parseBody(request, forgotPasswordSchema);
      const result = await forgotPassword(input.email);

      // The same response is returned whether or not the account exists, so
      // this endpoint cannot be used to enumerate registered emails.
      return jsonSuccess({
        accepted: true,
        resetCode: isProduction() ? undefined : result.devCode,
      });
    },
  );
}
