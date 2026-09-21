const DEFAULT_CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "CAD", "AUD"] as const;

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

export const env = {
  appEnv: read("APP_ENV") ?? process.env.NODE_ENV ?? "development",
  appUrl: read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:43127",
  sessionSecret: read("SESSION_SECRET"),
  dataStore: (read("DATA_STORE") ?? "local") as "local" | "dynamodb",
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

export function isCognitoConfigured(): boolean {
  return Boolean(env.cognitoUserPoolId && env.cognitoClientId);
}

export function isDynamoConfigured(): boolean {
  return Boolean(env.awsRegion && env.dynamoTableName);
}

export function isS3Configured(): boolean {
  return Boolean(env.awsRegion && env.s3BucketName);
}

export function isN8nConfigured(): boolean {
  return Boolean(env.n8nWebhookBaseUrl && env.n8nWebhookSecret);
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
