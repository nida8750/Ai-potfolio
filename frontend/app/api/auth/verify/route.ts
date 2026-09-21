import { handleRoute, parseBody } from "@/lib/api/route";
import { verifyEmail } from "@/lib/auth/server";
import { verifyEmailSchema } from "@/lib/validation/auth";
import { jsonSuccess } from "@/lib/security/http";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "auth.verify", rateLimit: { limit: 10, windowMs: 15 * 60 * 1000 } },
    async () => {
      const input = await parseBody(request, verifyEmailSchema);
      await verifyEmail(input.email, input.code);
      return jsonSuccess({ verified: true });
    },
  );
}
