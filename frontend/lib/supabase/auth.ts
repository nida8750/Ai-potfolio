import "server-only";
import { timingSafeEqual } from "node:crypto";
import { AuthError } from "@/lib/auth/errors";
import { hashValue } from "@/lib/auth/password";
import { createCode } from "@/lib/data/ids";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

const CODE_TTL_MS = 30 * 60 * 1000;
const VERIFY_HASH = "smtp_verify_hash";
const VERIFY_EXP = "smtp_verify_exp";
const RESET_HASH = "smtp_reset_hash";
const RESET_EXP = "smtp_reset_exp";

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
  if (lower.includes("rate limit")) {
    throw new AuthError(
      "Email sending is temporarily limited. Wait a minute and try again.",
      "RATE_LIMITED",
      429,
    );
  }
  throw new AuthError(message, "AUTH_PROVIDER", error?.status ?? 400);
}

function metadataOf(user: User): Record<string, unknown> {
  return { ...(user.user_metadata ?? {}) };
}

function hashesMatch(stored: unknown, code: string): boolean {
  if (typeof stored !== "string" || !stored) {
    return false;
  }
  const left = Buffer.from(stored);
  const right = Buffer.from(hashValue(code));
  return left.length === right.length && timingSafeEqual(left, right);
}

function isExpired(value: unknown): boolean {
  const expires = Number(value);
  return !Number.isFinite(expires) || expires < Date.now();
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
  const normalized = email.toLowerCase();
  const profile = await supabaseAdmin()
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (profile.error) {
    throw new AuthError(profile.error.message, "AUTH_PROVIDER");
  }
  if (profile.data?.id) {
    const { data, error } = await supabaseAdmin().auth.admin.getUserById(profile.data.id);
    if (!error && data.user) {
      return data.user;
    }
  }

  const { data, error } = await supabaseAdmin().auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    asAuthError(error);
  }
  return data.users.find((user) => (user.email ?? "").toLowerCase() === normalized) ?? null;
}

async function writeMetadata(userId: string, metadata: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });
  if (error) {
    asAuthError(error);
  }
}

async function issueHashedCode(
  userId: string,
  hashKey: string,
  expKey: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin().auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new AuthError("Could not create a verification code.", "AUTH_PROVIDER");
  }
  const code = createCode();
  const metadata = metadataOf(data.user);
  metadata[hashKey] = hashValue(code);
  metadata[expKey] = Date.now() + CODE_TTL_MS;
  await writeMetadata(userId, metadata);
  return code;
}

export async function supabaseSignUp(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  // Admin create never triggers Supabase Auth email. SMTP sends the code.
  const { data, error } = await supabaseAdmin().auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
    user_metadata: {
      name: input.name,
      phone: input.phone ?? "",
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
    confirmationRequired: true,
  };
}

export async function supabaseIssueVerifyCode(userId: string): Promise<string> {
  return issueHashedCode(userId, VERIFY_HASH, VERIFY_EXP);
}

export async function supabaseIssueVerifyCodeForEmail(
  email: string,
): Promise<string | undefined> {
  const user = await findAuthUserByEmail(email);
  if (!user || user.email_confirmed_at) {
    return undefined;
  }
  return supabaseIssueVerifyCode(user.id);
}

export async function supabaseIssueResetCodeForEmail(
  email: string,
): Promise<string | undefined> {
  const user = await findAuthUserByEmail(email);
  if (!user) {
    return undefined;
  }
  return issueHashedCode(user.id, RESET_HASH, RESET_EXP);
}

export async function supabaseConfirm(email: string, code: string): Promise<void> {
  const user = await findAuthUserByEmail(email);
  const metadata = user ? metadataOf(user) : {};
  if (!user || !hashesMatch(metadata[VERIFY_HASH], code) || isExpired(metadata[VERIFY_EXP])) {
    throw new AuthError("Verification code is invalid.", "INVALID_CODE");
  }

  delete metadata[VERIFY_HASH];
  delete metadata[VERIFY_EXP];
  const { error } = await supabaseAdmin().auth.admin.updateUserById(user.id, {
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) {
    asAuthError(error);
  }
}

export async function supabaseEmailConfirmed(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().auth.admin.getUserById(userId);
  if (error || !data.user) {
    return false;
  }
  return Boolean(data.user.email_confirmed_at);
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
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    throw new AuthError("Verify your email before signing in.", "UNVERIFIED", 403);
  }
  return { userId: data.user.id, email: data.user.email ?? email };
}

export async function supabaseSignOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function supabaseResetPassword(
  email: string,
  code: string,
  password: string,
): Promise<void> {
  const user = await findAuthUserByEmail(email);
  const metadata = user ? metadataOf(user) : {};
  if (!user || !hashesMatch(metadata[RESET_HASH], code) || isExpired(metadata[RESET_EXP])) {
    throw new AuthError("Reset code is invalid or expired.", "INVALID_CODE");
  }

  delete metadata[RESET_HASH];
  delete metadata[RESET_EXP];
  delete metadata[VERIFY_HASH];
  delete metadata[VERIFY_EXP];
  const { error } = await supabaseAdmin().auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
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
