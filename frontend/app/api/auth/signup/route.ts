import { handleRoute, parseBody } from "@/lib/api/route";
import { signUp } from "@/lib/auth/server";
import { signupSchema } from "@/lib/validation/auth";
import { jsonSuccess } from "@/lib/security/http";

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "auth.signup", rateLimit: { limit: 5, windowMs: 15 * 60 * 1000 } },
    async () => {
      const input = await parseBody(request, signupSchema);
      const result = await signUp(input);

      return jsonSuccess(
        {
          confirmationRequired: result.confirmationRequired,
        },
        201,
      );
    },
  );
}
