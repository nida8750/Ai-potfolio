import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  databaseUrlHasRealPassword,
  isBlankOrPlaceholder,
  missingSupabaseKeys,
  resolveDataStore,
} from "@/lib/env";
import { hasSessionCookie, isSupabaseAuthCookieName } from "@/lib/auth/cookie";
import { mapProfile, mapProject, mapService } from "@/lib/supabase/map";

const PROJECT_URL = "https://wpdslwonqowelbrublju.supabase.co";
const DATABASE_EXAMPLE =
  "postgresql://postgres:@db.wpdslwonqowelbrublju.supabase.co:5432/postgres";

describe("supabase env detection", () => {
  it("treats [YOUR-PASSWORD] as missing, not as a secret", () => {
    assert.equal(isBlankOrPlaceholder("[YOUR-PASSWORD]"), true);
    assert.equal(
      databaseUrlHasRealPassword(
        "postgresql://postgres:[YOUR-PASSWORD]@db.wpdslwonqowelbrublju.supabase.co:5432/postgres",
      ),
      false,
    );
  });

  it("treats the empty-password example URI as not configured", () => {
    assert.equal(databaseUrlHasRealPassword(DATABASE_EXAMPLE), false);
    assert.equal(databaseUrlHasRealPassword(""), false);
    assert.equal(databaseUrlHasRealPassword(undefined), false);
  });

  it("lists the keys that are still required", () => {
    assert.deepEqual(
      missingSupabaseKeys({
        url: PROJECT_URL,
        anonKey: "",
        serviceRoleKey: undefined,
      }),
      ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    );
  });

  it("stays on the local store until URL, anon, and service role are real", () => {
    assert.equal(
      resolveDataStore({
        url: PROJECT_URL,
        anonKey: "",
        serviceRoleKey: "",
        dataStore: "auto",
      }),
      "local",
    );
    assert.equal(
      resolveDataStore({
        url: PROJECT_URL,
        anonKey: "anon-key",
        serviceRoleKey: "service-role-key",
        dataStore: "auto",
      }),
      "supabase",
    );
    assert.equal(
      resolveDataStore({
        url: PROJECT_URL,
        anonKey: "anon-key",
        serviceRoleKey: "service-role-key",
        dataStore: "local",
      }),
      "local",
    );
  });
});

describe("supabase row mapping", () => {
  it("maps a profile without leaking a service-role field", () => {
    const profile = mapProfile({
      id: "11111111-1111-4111-8111-111111111111",
      email: "nida@example.test",
      name: "Nida",
      role: "ADMIN",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(profile.supabaseUserId, profile.id);
    assert.equal(profile.role, "ADMIN");
    assert.equal("serviceRoleKey" in profile, false);
  });

  it("coerces numeric prices from Postgres numeric strings", () => {
    const service = mapService({
      id: "22222222-2222-4222-8222-222222222222",
      slug: "ai-agents",
      title: "AI Agents",
      description: "Agents",
      short_description: "Agents",
      technologies: ["LangGraph"],
      price: "450.00",
      currency: "USD",
      pricing_type: "fixed",
      icon: "agents",
      is_active: true,
      featured: false,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(service.price, 450);
    assert.equal(service.isActive, true);
  });

  it("maps published project flags", () => {
    const project = mapProject({
      id: "33333333-3333-4333-8333-333333333333",
      title: "Copilot",
      slug: "copilot",
      category: "RAG",
      description: "Docs",
      technologies: ["React"],
      is_published: true,
      featured: true,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(project.isPublished, true);
    assert.equal(project.sortOrder, 1);
  });
});

describe("session cookies", () => {
  it("accepts the local cookie or a Supabase Auth cookie", () => {
    assert.equal(isSupabaseAuthCookieName("sb-wpdslwonqowelbrublju-auth-token"), true);
    assert.equal(
      hasSessionCookie([{ name: "nida_session", value: "signed" }]),
      true,
    );
    assert.equal(
      hasSessionCookie([
        { name: "sb-wpdslwonqowelbrublju-auth-token", value: "jwt" },
      ]),
      true,
    );
    assert.equal(hasSessionCookie([{ name: "other", value: "x" }]), false);
  });
});

describe("schema files", () => {
  const init = readFileSync(
    path.join(process.cwd(), "supabase/migrations/0001_init.sql"),
    "utf8",
  );

  it("defines the production tables and RLS policies", () => {
    for (const table of [
      "profiles",
      "services",
      "projects",
      "inquiries",
      "orders",
      "payments",
    ]) {
      assert.match(init, new RegExp(`create table if not exists public\\.${table}`));
    }
    assert.match(init, /Public read published services/);
    assert.match(init, /Public read published projects/);
    assert.match(init, /Users own orders/);
    assert.match(init, /Users read own inquiries/);
    assert.match(init, /Admins manage services/);
    assert.match(init, /SUPABASE_SERVICE_ROLE_KEY|service role/i);
    assert.doesNotMatch(init, /\[YOUR-PASSWORD\]/);
  });

  it("keeps the assets bucket private", () => {
    assert.match(init, /insert into storage\.buckets/);
    assert.match(init, /'assets'/);
    assert.match(init, /public = excluded\.public/);
  });
});
