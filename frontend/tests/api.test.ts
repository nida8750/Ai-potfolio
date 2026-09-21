import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

/**
 * End-to-end checks against a running dev server. Start it with `npm run dev`
 * and run `npm run test:api`. Skipped automatically when nothing is listening.
 */
const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:43127";

let serverUp = false;
const jars = new Map<string, string>();

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@company.test`;
}

async function call(
  path: string,
  options: { method?: string; json?: unknown; as?: string } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = { origin: BASE };
  if (options.json) {
    headers["content-type"] = "application/json";
  }
  const cookie = options.as ? jars.get(options.as) : undefined;
  if (cookie) {
    headers.cookie = cookie;
  }

  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? (options.json ? "POST" : "GET"),
    headers,
    body: options.json ? JSON.stringify(options.json) : undefined,
    redirect: "manual",
  });

  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (options.as && setCookie.length > 0) {
    const session = setCookie.find((value) => value.startsWith("nida_session="));
    if (session) {
      jars.set(options.as, session.split(";")[0]);
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  return { status: response.status, body };
}

function data(body: Record<string, unknown>): Record<string, unknown> {
  return (body.data ?? {}) as Record<string, unknown>;
}

function errorCode(body: Record<string, unknown>): string {
  return ((body.error ?? {}) as { code?: string }).code ?? "";
}

async function register(as: string): Promise<string> {
  const email = unique(as);
  const signup = await call("/api/auth/signup", {
    json: { name: "Test Person", email, password: "Passw0rd123" },
  });
  const code = data(signup.body).verificationCode as string;
  await call("/api/auth/verify", { json: { email, code } });
  await call("/api/auth/login", { json: { email, password: "Passw0rd123" }, as });
  return email;
}

before(async () => {
  try {
    const response = await fetch(`${BASE}/api/services`);
    serverUp = response.ok;
  } catch {
    serverUp = false;
  }
});

after(() => {
  if (!serverUp) {
    console.warn(`No server at ${BASE}; API tests were skipped.`);
  }
});

describe("public endpoints", { skip: !process.env.TEST_BASE_URL && false }, () => {
  it("serves active services", async (t) => {
    if (!serverUp) return t.skip("server not running");
    const result = await call("/api/services");
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(data(result.body).services));
  });

  it("serves published projects", async (t) => {
    if (!serverUp) return t.skip("server not running");
    const result = await call("/api/projects");
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(data(result.body).projects));
  });

  it("stores a valid inquiry and reports automation state honestly", async (t) => {
    if (!serverUp) return t.skip("server not running");
    const result = await call("/api/contact", {
      json: {
        name: "Ayesha Khan",
        email: unique("inquiry"),
        message: "We need an agent workflow to triage inbound leads.",
      },
    });
    assert.equal(result.status, 201);
    assert.equal(data(result.body).stored, true);
    assert.equal(typeof data(result.body).automationConfigured, "boolean");
  });

  it("rejects an invalid inquiry", async (t) => {
    if (!serverUp) return t.skip("server not running");
    const result = await call("/api/contact", {
      json: { name: "x", email: "nope", message: "short" },
    });
    assert.equal(result.status, 422);
  });
});

describe("authentication and authorization", () => {
  it("refuses protected endpoints without a session", async (t) => {
    if (!serverUp) return t.skip("server not running");
    assert.equal((await call("/api/profile")).status, 401);
    assert.equal((await call("/api/orders")).status, 401);
    assert.equal((await call("/api/admin/overview")).status, 401);
  });

  it("refuses admin endpoints for a normal user", async (t) => {
    if (!serverUp) return t.skip("server not running");
    await register("member");
    const overview = await call("/api/admin/overview", { as: "member" });
    assert.equal(overview.status, 403);
    assert.equal(errorCode(overview.body), "FORBIDDEN");

    const create = await call("/api/admin/services", {
      as: "member",
      json: {
        title: "Should not exist",
        description: "A normal user must not be able to create this.",
        pricingType: "custom",
      },
    });
    assert.equal(create.status, 403);
  });

  it("scopes order listings to the signed-in account", async (t) => {
    if (!serverUp) return t.skip("server not running");
    await register("scoped");
    const orders = await call("/api/orders", { as: "scoped" });
    assert.equal(orders.status, 200);
    assert.deepEqual(data(orders.body).orders, []);
  });

  it("rejects a cross-origin state change", async (t) => {
    if (!serverUp) return t.skip("server not running");
    const response = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://attacker.test" },
      body: JSON.stringify({
        name: "Ayesha Khan",
        email: unique("csrf"),
        message: "This request comes from another origin entirely.",
      }),
    });
    assert.equal(response.status, 403);
  });
});

describe("payment safety", () => {
  it("refuses an unsigned Stripe webhook", async (t) => {
    if (!serverUp) return t.skip("server not running");
    const response = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "evt_forged", type: "checkout.session.completed" }),
    });
    // Either the signature check fails or Stripe is not configured at all;
    // in neither case may the event be accepted.
    assert.ok(response.status >= 400);
  });

  it("refuses checkout for an order that does not belong to the caller", async (t) => {
    if (!serverUp) return t.skip("server not running");
    await register("outsider");
    const result = await call("/api/payments/checkout", {
      as: "outsider",
      json: { orderId: "00000000-0000-4000-8000-000000000000" },
    });
    assert.equal(result.status, 404);
  });
});
