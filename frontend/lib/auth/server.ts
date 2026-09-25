import "server-only";
import {
  activeAuthProvider,
  isCognitoConfigured,
  isDesignatedAdmin,
  isSmtpConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { sendResetEmail, sendVerificationEmail } from "@/lib/mail/smtp";
import {
  cognitoConfirm,
  cognitoConfirmForgotPassword,
  cognitoForgotPassword,
  cognitoLogin,
  cognitoSignUp,
} from "@/lib/aws/auth";
import { AuthError } from "@/lib/auth/errors";
import { hashPassword, hashValue, verifyPassword } from "@/lib/auth/password";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";
import { createCode } from "@/lib/data/ids";
import { nextUserRole, repository } from "@/lib/data/repository";
import { logEvent } from "@/lib/security/logger";
import {
  supabaseAuthUser,
  supabaseConfirm,
  supabaseEmailConfirmed,
  supabaseIssueResetCodeForEmail,
  supabaseIssueVerifyCode,
  supabaseIssueVerifyCodeForEmail,
  supabaseLogin,
  supabaseResetPassword,
  supabaseSignOut,
  supabaseSignUp,
} from "@/lib/supabase/auth";
import type { AuthUser } from "@/lib/auth/session";
import type { UserProfile } from "@/types/user";

export { AuthError };

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isSupabaseConfigured()) {
    const auth = await supabaseAuthUser();
    if (!auth) {
      return null;
    }
    const profile =
      (await repository.getUser(auth.id)) ??
      (auth.email ? await repository.getUserByEmail(auth.email) : undefined);
    if (!profile || profile.status !== "active") {
      return null;
    }
    const resolved = await ensureDesignatedAdmin(profile);
    return {
      id: resolved.id,
      email: resolved.email,
      name: resolved.name,
      role: resolved.role,
    };
  }

  const session = await readSession();
  if (!session) {
    return null;
  }
  const profile = await repository.getUser(session.userId);
  if (!profile || profile.status !== "active") {
    return null;
  }
  const resolved = await ensureDesignatedAdmin(profile);
  return {
    id: resolved.id,
    email: resolved.email,
    name: resolved.name,
    role: resolved.role,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Sign in to continue.", "UNAUTHENTICATED", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  const profile = await repository.getUser(user.id);
  if (!profile) {
    throw new AuthError("Admin access required.", "FORBIDDEN", 403);
  }
  const resolved = await ensureDesignatedAdmin(profile);
  if (resolved.role !== "ADMIN") {
    throw new AuthError("Admin access required.", "FORBIDDEN", 403);
  }
  return { ...user, role: resolved.role };
}

async function ensureDesignatedAdmin(profile: UserProfile): Promise<UserProfile> {
  if (!isDesignatedAdmin(profile.email)) {
    return profile;
  }
  if (profile.role === "ADMIN" && profile.status === "active") {
    return profile;
  }
  return (
    (await repository.updateUser(profile.id, { role: "ADMIN", status: "active" })) ?? {
      ...profile,
      role: "ADMIN",
      status: "active",
    }
  );
}

async function ensureProfile(input: {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  cognitoSub?: string;
  supabaseUserId?: string;
}): Promise<UserProfile> {
  const existing =
    (input.id ? await repository.getUser(input.id) : undefined) ??
    (await repository.getUserByEmail(input.email));
  if (existing) {
    if (!isDesignatedAdmin(existing.email) && !isDesignatedAdmin(input.email)) {
      return existing;
    }
    const patch: Partial<UserProfile> = {};
    if (existing.role !== "ADMIN") {
      patch.role = "ADMIN";
    }
    if (existing.status !== "active") {
      patch.status = "active";
    }
    if (input.name && existing.name !== input.name) {
      patch.name = input.name;
    }
    if (input.phone && existing.phone !== input.phone) {
      patch.phone = input.phone;
    }
    if (Object.keys(patch).length === 0) {
      return existing;
    }
    return (await repository.updateUser(existing.id, patch)) ?? { ...existing, ...patch };
  }
  return repository.createUser({
    id: input.id ?? input.supabaseUserId ?? crypto.randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    phone: input.phone,
    cognitoSub: input.cognitoSub,
    supabaseUserId: input.supabaseUserId,
    role: await nextUserRole(input.email),
    status: "active",
  });
}

async function requireSmtpSend(
  send: () => Promise<void>,
  failedMessage: string,
): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new AuthError(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.",
      "SMTP_NOT_CONFIGURED",
      503,
    );
  }
  try {
    await send();
  } catch (error) {
    const detail = error instanceof Error ? error.message.trim() : "";
    throw new AuthError(
      detail && detail.length < 180 ? `${failedMessage} ${detail}` : failedMessage,
      "SMTP_SEND_FAILED",
      502,
    );
  }
}

async function sendVerificationCode(email: string, code: string): Promise<void> {
  await requireSmtpSend(
    () => sendVerificationEmail({ to: email, code }),
    "The verification email could not be sent. Check SMTP_USER and SMTP_PASSWORD.",
  );
}

async function sendResetCode(email: string, code: string): Promise<void> {
  await requireSmtpSend(
    () => sendResetEmail({ to: email, code }),
    "The reset email could not be sent. Check SMTP_USER and SMTP_PASSWORD.",
  );
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ confirmationRequired: boolean; devCode?: string }> {
  const email = input.email.toLowerCase();
  const existing = await repository.getUserByEmail(email);
  if (existing) {
    if (isSupabaseConfigured()) {
      const confirmed = await supabaseEmailConfirmed(
        existing.supabaseUserId ?? existing.id,
      );
      if (confirmed) {
        throw new AuthError("An account with this email already exists.", "EMAIL_TAKEN", 409);
      }
      const code = await supabaseIssueVerifyCode(existing.supabaseUserId ?? existing.id);
      await sendVerificationCode(email, code);
      return { confirmationRequired: true };
    }
    throw new AuthError("An account with this email already exists.", "EMAIL_TAKEN", 409);
  }

  if (isSupabaseConfigured()) {
    const created = await supabaseSignUp({
      email,
      password: input.password,
      name: input.name,
      phone: input.phone,
    });
    await ensureProfile({
      id: created.userId,
      email,
      name: input.name,
      phone: input.phone,
      supabaseUserId: created.userId,
    });
    logEvent({ action: "auth.signup", result: "ok", userId: created.userId });
    const code = await supabaseIssueVerifyCode(created.userId);
    await sendVerificationCode(email, code);
    return { confirmationRequired: true };
  }

  if (isCognitoConfigured()) {
    const cognito = await cognitoSignUp(email, input.password, input.name);
    await ensureProfile({
      email,
      name: input.name,
      phone: input.phone,
      cognitoSub: cognito.userSub,
    });
    return { confirmationRequired: cognito.confirmationRequired };
  }

  const code = createCode();
  const profile = await ensureProfile({
    email,
    name: input.name,
    phone: input.phone,
  });
  await repository.putCredential({
    userId: profile.id,
    email,
    passwordHash: hashPassword(input.password),
    verified: false,
    verificationHash: hashValue(code),
  });
  logEvent({ action: "auth.signup", result: "ok", userId: profile.id });
  await sendVerificationCode(email, code);
  return { confirmationRequired: true };
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  const normalized = email.toLowerCase();
  if (isSupabaseConfigured()) {
    await supabaseConfirm(normalized, code);
    return;
  }
  if (isCognitoConfigured()) {
    await cognitoConfirm(normalized, code);
    return;
  }
  const credential = await repository.getCredential(normalized);
  if (!credential?.verificationHash || credential.verificationHash !== hashValue(code)) {
    throw new AuthError("Verification code is invalid.", "INVALID_CODE");
  }
  await repository.putCredential({ ...credential, verified: true, verificationHash: undefined });
}

export async function signInAdmin(email: string, password: string): Promise<AuthUser> {
  if (!isDesignatedAdmin(email)) {
    throw new AuthError("Admin sign-in requires the admin Gmail and password.", "FORBIDDEN", 403);
  }
  const user = await signIn(email, password);
  if (user.role === "ADMIN") {
    return user;
  }
  const promoted = await repository.updateUser(user.id, { role: "ADMIN", status: "active" });
  if (promoted?.role === "ADMIN") {
    return {
      id: promoted.id,
      email: promoted.email,
      name: promoted.name,
      role: "ADMIN",
    };
  }
  await signOutUser();
  throw new AuthError("This account is not an administrator.", "FORBIDDEN", 403);
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const normalized = email.toLowerCase();

  if (isSupabaseConfigured()) {
    const auth = await supabaseLogin(normalized, password);
    const profile =
      (await repository.getUser(auth.userId)) ?? (await repository.getUserByEmail(normalized));
    if (!profile || profile.status !== "active") {
      throw new AuthError("Account is not available.", "INACTIVE", 403);
    }
    await writeSession(profile.id, profile.email);
    return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
  }

  if (isCognitoConfigured()) {
    await cognitoLogin(normalized, password);
    const profile = await repository.getUserByEmail(normalized);
    if (!profile || profile.status !== "active") {
      throw new AuthError("Account is not available.", "INACTIVE", 403);
    }
    await writeSession(profile.id, profile.email);
    return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
  }

  const credential = await repository.getCredential(normalized);
  const profile = await repository.getUserByEmail(normalized);
  if (!credential || !profile || !verifyPassword(password, credential.passwordHash)) {
    throw new AuthError("Email or password is incorrect.", "INVALID_CREDENTIALS", 401);
  }
  if (!credential.verified) {
    throw new AuthError("Verify your email before signing in.", "UNVERIFIED", 403);
  }
  if (profile.status !== "active") {
    throw new AuthError("Account is disabled.", "INACTIVE", 403);
  }
  await writeSession(profile.id, profile.email);
  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabaseSignOut();
  }
  await clearSession();
}

export async function resendVerification(email: string): Promise<{ devCode?: string }> {
  const normalized = email.toLowerCase();

  if (isSupabaseConfigured()) {
    const code = await supabaseIssueVerifyCodeForEmail(normalized);
    if (!code) {
      return {};
    }
    await sendVerificationCode(normalized, code);
    return {};
  }
  if (isCognitoConfigured()) {
    return {};
  }

  const credential = await repository.getCredential(normalized);
  if (!credential || credential.verified) {
    return {};
  }
  const code = createCode();
  await repository.putCredential({
    ...credential,
    verificationHash: hashValue(code),
  });
  await sendVerificationCode(normalized, code);
  return {};
}

export async function forgotPassword(email: string): Promise<{ devCode?: string }> {
  const normalized = email.toLowerCase();
  if (isSupabaseConfigured()) {
    const code = await supabaseIssueResetCodeForEmail(normalized);
    if (!code) {
      return {};
    }
    await sendResetCode(normalized, code);
    return {};
  }
  if (isCognitoConfigured()) {
    await cognitoForgotPassword(normalized);
    return {};
  }
  const credential = await repository.getCredential(normalized);
  if (!credential) {
    return {};
  }
  const code = createCode();
  await repository.putCredential({
    ...credential,
    resetHash: hashValue(code),
    resetExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
  await sendResetCode(normalized, code);
  return {};
}

export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  const normalized = email.toLowerCase();
  if (isSupabaseConfigured()) {
    await supabaseResetPassword(normalized, code, password);
    return;
  }
  if (isCognitoConfigured()) {
    await cognitoConfirmForgotPassword(normalized, code, password);
    return;
  }
  const credential = await repository.getCredential(normalized);
  if (
    !credential?.resetHash ||
    !credential.resetExpiresAt ||
    credential.resetHash !== hashValue(code) ||
    new Date(credential.resetExpiresAt).getTime() < Date.now()
  ) {
    throw new AuthError("Reset code is invalid or expired.", "INVALID_CODE");
  }
  await repository.putCredential({
    ...credential,
    passwordHash: hashPassword(password),
    resetHash: undefined,
    resetExpiresAt: undefined,
    verified: true,
  });
}

export function currentAuthProvider() {
  return activeAuthProvider();
}
