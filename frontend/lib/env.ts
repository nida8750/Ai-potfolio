const DEFAULT_CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "CAD", "AUD"] as const;

export const SUPABASE_PROJECT_REF = "wpdslwonqowelbrublju";
export const SUPABASE_PUBLIC_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

export type DataStoreName = "auto" | "local" | "supabase" | "dynamodb";
export type ActiveDataStore = "local" | "supabase" | "dynamodb";
export type AuthProviderName = "local" | "supabase" | "cognito";
export type StorageProviderName = "none" | "supabase" | "s3";

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readList(name: string, fallback: readonly string[]): string[] {
  const raw = read(name);
  if (!raw) {
    return [...fallback];
  }
  return raw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Treats empty values and documented placeholders as missing. The string
 * `[YOUR-PASSWORD]` is never a secret.
 */
export function isBlankOrPlaceholder(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  if (/\[YOUR[-_]?PASSWORD\]/i.test(trimmed)) {
    return true;
  }
  if (/^your[-_]?password$/i.test(trimmed)) {
    return true;
  }
  if (/^(changeme|placeholder|todo|xxx+|replace[-_]?me)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

export function databaseUrlHasRealPassword(url: string | undefined): boolean {
  if (isBlankOrPlaceholder(url)) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const password = decodeURIComponent(parsed.password);
    return !isBlankOrPlaceholder(password);
  } catch {
    return false;
  }
}

export interface SupabaseEnvInput {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  databaseUrl?: string;
  dataStore?: string;
  dynamoReady?: boolean;
}

export function missingSupabaseKeys(input: {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
}): string[] {
  const missing: string[] = [];
  if (isBlankOrPlaceholder(input.url)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (isBlankOrPlaceholder(input.anonKey)) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (isBlankOrPlaceholder(input.serviceRoleKey)) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return missing;
}

export function resolveDataStore(input: SupabaseEnvInput): ActiveDataStore {
  const requested = (input.dataStore ?? "auto") as DataStoreName;

  if (requested === "dynamodb") {
    if (!input.dynamoReady) {
      throw new Error(
        "DATA_STORE=dynamodb requires AWS_REGION and DYNAMODB_TABLE_NAME to be set.",
      );
    }
    return "dynamodb";
  }

  const supabaseReady = missingSupabaseKeys(input).length === 0;

  if (requested === "local") {
    return "local";
  }
  if (requested === "supabase") {
    return supabaseReady ? "supabase" : "local";
  }
  return supabaseReady ? "supabase" : "local";
}

if (read("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") || read("NEXT_PUBLIC_DATABASE_URL")) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL are server-only and must never use a NEXT_PUBLIC_ prefix.",
  );
}

export const env = {
  appEnv: read("APP_ENV") ?? process.env.NODE_ENV ?? "development",
  appUrl: read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:43127",
  sessionSecret: read("SESSION_SECRET"),
  dataStore: (read("DATA_STORE") ?? "auto") as DataStoreName,
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: read("SUPABASE_STORAGE_BUCKET") ?? "assets",
  databaseUrl: read("DATABASE_URL"),
  awsRegion: read("AWS_REGION"),
  cognitoUserPoolId: read("COGNITO_USER_POOL_ID"),
  cognitoClientId: read("COGNITO_CLIENT_ID"),
  dynamoTableName: read("DYNAMODB_TABLE_NAME"),
  s3BucketName: read("S3_BUCKET_NAME"),
  n8nWebhookBaseUrl: read("N8N_WEBHOOK_BASE_URL"),
  n8nWebhookSecret: read("N8N_WEBHOOK_SECRET"),
  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  stripePublishableKey: read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  paypalClientId: read("PAYPAL_CLIENT_ID"),
  paypalClientSecret: read("PAYPAL_CLIENT_SECRET"),
  paypalEnvironment: (read("PAYPAL_ENVIRONMENT") ?? "sandbox") as
    | "sandbox"
    | "production",
  defaultCurrency: (read("DEFAULT_CURRENCY") ?? "USD").toUpperCase(),
  supportedCurrencies: readList("SUPPORTED_CURRENCIES", DEFAULT_CURRENCIES),
  paymentProvider: (read("PAYMENT_PROVIDER") ?? "none") as
    | "stripe"
    | "paypal"
    | "none",
};

export function isProduction(): boolean {
  return env.appEnv === "production";
}

/**
 * Lets a development or test environment raise the request quotas. Production
 * always uses the configured limits as written.
 */
export function rateLimitMultiplier(): number {
  if (isProduction()) {
    return 1;
  }
  const raw = Number(read("RATE_LIMIT_MULTIPLIER") ?? "1");
  return Number.isFinite(raw) && raw >= 1 ? Math.min(raw, 1000) : 1;
}

export function missingSupabaseEnv(): string[] {
  return missingSupabaseKeys({
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    serviceRoleKey: env.supabaseServiceRoleKey,
  });
}

export function isSupabaseConfigured(): boolean {
  return missingSupabaseEnv().length === 0;
}

export function isDatabaseUrlConfigured(): boolean {
  return databaseUrlHasRealPassword(env.databaseUrl);
}

export function isCognitoConfigured(): boolean {
  return Boolean(env.cognitoUserPoolId && env.cognitoClientId);
}

export function isDynamoConfigured(): boolean {
  return Boolean(env.awsRegion && env.dynamoTableName);
}

export function isS3Configured(): boolean {
  return Boolean(env.awsRegion && env.s3BucketName);
}

export function isSupabaseStorageConfigured(): boolean {
  return isSupabaseConfigured();
}

export function isN8nConfigured(): boolean {
  return Boolean(env.n8nWebhookBaseUrl && env.n8nWebhookSecret);
}

export function activeDataStore(): ActiveDataStore {
  return resolveDataStore({
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    serviceRoleKey: env.supabaseServiceRoleKey,
    databaseUrl: env.databaseUrl,
    dataStore: env.dataStore,
    dynamoReady: isDynamoConfigured(),
  });
}

export function activeAuthProvider(): AuthProviderName {
  if (isSupabaseConfigured()) {
    return "supabase";
  }
  if (isCognitoConfigured()) {
    return "cognito";
  }
  return "local";
}

export function activeStorageProvider(): StorageProviderName {
  if (isSupabaseStorageConfigured()) {
    return "supabase";
  }
  if (isS3Configured()) {
    return "s3";
  }
  return "none";
}

export function isStorageConfigured(): boolean {
  return activeStorageProvider() !== "none";
}

export function requireSessionSecret(): string {
  if (env.sessionSecret && env.sessionSecret.length >= 32) {
    return env.sessionSecret;
  }

  if (isProduction()) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return "local-development-session-secret-only";
}
