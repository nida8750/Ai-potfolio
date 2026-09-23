import "server-only";
import { backendBaseUrl, env, isSupabaseConfigured } from "@/lib/env";
import type { DashboardOverview } from "@/lib/api/backend-types";
import { supabaseAccessToken } from "@/lib/supabase/auth";

export interface BackendHealth {
  reachable: boolean;
  phase?: number;
  service?: string;
  checks?: Record<string, string>;
  error?: string;
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${backendBaseUrl()}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return { reachable: false, error: `http_${response.status}` };
    }
    const payload = (await response.json()) as {
      data?: { phase?: number; service?: string; checks?: Record<string, string> };
    };
    return {
      reachable: true,
      phase: payload.data?.phase,
      service: payload.data?.service,
      checks: payload.data?.checks,
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.name : "unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUserAiOverview(): Promise<DashboardOverview | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const token = await supabaseAccessToken();
    if (!token) {
      return null;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`${backendBaseUrl()}/api/v1/dashboard/overview`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as { data?: DashboardOverview };
      return payload.data ?? null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

export async function backendInternalGet<T>(path: string): Promise<T | null> {
  const key = env.internalApiKey;
  if (!key) {
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${backendBaseUrl()}${path}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "X-Internal-Key": key,
      },
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { data?: T };
    return payload.data ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
