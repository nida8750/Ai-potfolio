import { SUPABASE_PROJECT_REF } from "@/lib/env";

export function supabaseProjectRef(): string {
  return SUPABASE_PROJECT_REF;
}

export function supabaseDashboardUrl(path = ""): string {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}${suffix}`;
}

export const SUPABASE_CONSOLE_LINKS = [
  { label: "Project home", href: supabaseDashboardUrl() },
  { label: "Auth users", href: supabaseDashboardUrl("auth/users") },
  { label: "Email / providers", href: supabaseDashboardUrl("auth/providers") },
  { label: "Table editor", href: supabaseDashboardUrl("editor") },
  { label: "SQL editor", href: supabaseDashboardUrl("sql/new") },
  { label: "Logs", href: supabaseDashboardUrl("logs/explorer") },
  { label: "Storage", href: supabaseDashboardUrl("storage/files") },
  { label: "API settings", href: supabaseDashboardUrl("settings/api") },
] as const;
