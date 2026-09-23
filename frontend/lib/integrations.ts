import {
  activeAuthProvider,
  activeDataStore,
  activeStorageProvider,
  isDatabaseUrlConfigured,
  isN8nConfigured,
  isSupabaseConfigured,
  missingSupabaseEnv,
} from "@/lib/env";
import { configuredProviders } from "@/lib/payments";

function dataStoreLabel(): string {
  const store = activeDataStore();
  if (store === "supabase") {
    return "Supabase Postgres";
  }
  if (store === "dynamodb") {
    return "DynamoDB";
  }
  return "Local file store";
}

function authLabel(): string {
  const provider = activeAuthProvider();
  if (provider === "supabase") {
    return "Supabase Auth";
  }
  if (provider === "cognito") {
    return "AWS Cognito";
  }
  return "Local development";
}

function storageLabel(): string {
  const provider = activeStorageProvider();
  if (provider === "supabase") {
    return "Supabase Storage";
  }
  if (provider === "s3") {
    return "Amazon S3";
  }
  return "Not configured";
}

export function integrationRows(): Array<[string, string]> {
  const payments = configuredProviders();
  return [
    ["Data store", dataStoreLabel()],
    ["Authentication", authLabel()],
    ["File storage", storageLabel()],
    ["Automation", isN8nConfigured() ? "n8n webhooks" : "Not configured"],
    ["Payments", payments.length ? payments.join(", ") : "Not configured"],
    ["FastAPI", "Checked live at /api/health"],
  ];
}

export function integrationStatus() {
  return {
    dataStore: activeDataStore(),
    auth: activeAuthProvider(),
    storage: activeStorageProvider(),
    supabase: isSupabaseConfigured(),
    databaseUrl: isDatabaseUrlConfigured(),
    missingSupabaseEnv: missingSupabaseEnv(),
    cognito: activeAuthProvider() === "cognito",
    s3: activeStorageProvider() === "s3",
    n8n: isN8nConfigured(),
    paymentProviders: configuredProviders(),
  };
}
