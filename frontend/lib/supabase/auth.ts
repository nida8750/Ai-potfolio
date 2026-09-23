import "server-only";
import { AuthError } from "@/lib/auth/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function asAuthError(error: { message: string; status?: number } | null): never {
  const message = error?.message ?? "Authentication failed.";
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    throw new AuthError("An account with this email already exists.", "EMAIL_TAKEN", 409);
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    throw new AuthError("Email or password is incorrect.", "INVALID_CREDENTIALS", 401);
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    throw new AuthError("Verify your email before signing in.", "UNVERIFIED", 403);
  }
  if (lower.includes("otp") || lower.includes("token") || lower.includes("code")) {
    throw new AuthError("Verification code is invalid.", "INVALID_CODE");
  }
  throw new AuthError(message, "AUTH_PROVIDER", error?.status ?? 400);
}

export async function supabaseSignUp(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        phone: input.phone ?? "",
      },
    },
  });

  if (error) {
    asAuthError(error);
  }
  if (!data.user) {
    throw new AuthError("Sign-up did not return a user.", "AUTH_PROVIDER");
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? input.email,
    confirmationRequired: !data.session,
  };
}

export async function supabaseConfirm(email: string, code: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "signup",
  });
  if (error) {
    asAuthError(error);
  }
}

export async function supabaseLogin(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    asAuthError(error);
  }
  if (!data.user) {
    throw new AuthError("Email or password is incorrect.", "INVALID_CREDENTIALS", 401);
  }
  return { userId: data.user.id, email: data.user.email ?? email };
}

export async function supabaseSignOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function supabaseForgotPassword(email: string, redirectTo: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error && !/unable to validate|user not found|signup_disabled/i.test(error.message)) {
    asAuthError(error);
  }
}

export async function supabaseResetPassword(
  email: string,
  code: string,
  password: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "recovery",
  });
  if (verifyError) {
    asAuthError(verifyError);
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    asAuthError(error);
  }
}

export async function supabaseAuthUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return { id: data.user.id, email: data.user.email ?? "" };
}

/** Supabase access token for FastAPI Bearer auth. Null when not configured. */
export async function supabaseAccessToken(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
