import { handleRoute, parseBody } from "@/lib/api/route";
import { resendVerification } from "@/lib/auth/server";
import { jsonSuccess } from "@/lib/security/http";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "auth.resend_verification", rateLimit: { limit: 5, windowMs: 15 * 60 * 1000 } },
    async () => {
      const input = await parseBody(request, forgotPasswordSchema);
      await resendVerification(input.email);

      return jsonSuccess({ accepted: true });
    },
  );
}
