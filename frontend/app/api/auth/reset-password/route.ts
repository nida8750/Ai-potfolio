import { handleRoute, parseBody } from "@/lib/api/route";
import { resetPassword } from "@/lib/auth/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { jsonSuccess } from "@/lib/security/http";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "auth.reset_password", rateLimit: { limit: 10, windowMs: 15 * 60 * 1000 } },
    async () => {
      const input = await parseBody(request, resetPasswordSchema);
      await resetPassword(input.email, input.code, input.password);
      return jsonSuccess({ reset: true });
    },
  );
}
