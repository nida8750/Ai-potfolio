import "server-only";
import { isCognitoConfigured } from "@/lib/env";
import {
  cognitoConfirm,
  cognitoConfirmForgotPassword,
  cognitoForgotPassword,
  cognitoLogin,
  cognitoSignUp,
} from "@/lib/aws/auth";
import { hashPassword, hashValue, verifyPassword } from "@/lib/auth/password";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";
import { createCode } from "@/lib/data/ids";
import { nextUserRole, repository } from "@/lib/data/repository";
import { logEvent } from "@/lib/security/logger";
import type { AuthUser } from "@/lib/auth/session";
import type { UserProfile } from "@/types/user";

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }
  const profile = await repository.getUser(session.userId);
  if (!profile || profile.status !== "active") {
    return null;
  }
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
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
  if (!profile || profile.role !== "ADMIN") {
    throw new AuthError("Admin access required.", "FORBIDDEN", 403);
  }
  return { ...user, role: profile.role };
}

async function ensureProfile(input: {
  email: string;
  name: string;
  phone?: string;
  cognitoSub?: string;
}): Promise<UserProfile> {
  const existing = await repository.getUserByEmail(input.email);
  if (existing) {
    return existing;
  }
  return repository.createUser({
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    phone: input.phone,
    cognitoSub: input.cognitoSub,
    role: await nextUserRole(),
    status: "active",
  });
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ confirmationRequired: boolean; devCode?: string }> {
  const email = input.email.toLowerCase();
  if (await repository.getUserByEmail(email)) {
    throw new AuthError("An account with this email already exists.", "EMAIL_TAKEN", 409);
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
  return { confirmationRequired: true, devCode: code };
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  const normalized = email.toLowerCase();
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

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const normalized = email.toLowerCase();

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
  await clearSession();
}

export async function forgotPassword(email: string): Promise<{ devCode?: string }> {
  const normalized = email.toLowerCase();
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
  return { devCode: code };
}

export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  const normalized = email.toLowerCase();
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