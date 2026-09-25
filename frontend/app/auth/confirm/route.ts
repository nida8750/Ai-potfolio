import { redirect } from "next/navigation";

/**
 * Supabase Auth confirmation links are not used. Verification is a 6-digit
 * code emailed over SMTP from the admin Gmail account.
 */
export async function GET() {
  redirect("/login?error=verify");
}
