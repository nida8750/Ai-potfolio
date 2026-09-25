import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { verifyStripeSignature, fromMinorUnits, toMinorUnits } from "@/lib/payments/stripe";
import { decodeSession, encodeSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { allowedOrderTransitions } from "@/lib/data/repository";
import { serviceInputSchema, serviceUpdateSchema } from "@/lib/validation/service";
import { projectInputSchema } from "@/lib/validation/project";
import { contactSchema } from "@/lib/validation/contact";
import { rateLimit } from "@/lib/security/rate-limit";
import { postLoginPath, safeInternalPath } from "@/lib/security/redirect";
import { sanitizeMultiline, sanitizeText } from "@/lib/security/sanitize";

const SECRET = "whsec_test_secret_value_for_unit_tests";

function stripeHeader(body: string, timestamp: number, secret = SECRET): string {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("stripe webhook signatures", () => {
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const now = 1_700_000_000;

  it("accepts a correctly signed payload", () => {
    assert.equal(
      verifyStripeSignature(body, stripeHeader(body, now), SECRET, now),
      true,
    );
  });

  it("rejects a tampered body", () => {
    const header = stripeHeader(body, now);
    const tampered = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
    assert.equal(verifyStripeSignature(tampered, header, SECRET, now), false);
  });

  it("rejects a signature made with a different secret", () => {
    const header = stripeHeader(body, now, "whsec_wrong_secret_value_here");
    assert.equal(verifyStripeSignature(body, header, SECRET, now), false);
  });

  it("rejects a replayed timestamp outside the tolerance window", () => {
    const header = stripeHeader(body, now - 4000);
    assert.equal(verifyStripeSignature(body, header, SECRET, now), false);
  });

  it("rejects a missing or malformed header", () => {
    assert.equal(verifyStripeSignature(body, null, SECRET, now), false);
    assert.equal(verifyStripeSignature(body, "garbage", SECRET, now), false);
  });
});

describe("currency minor units", () => {
  it("scales decimal currencies", () => {
    assert.equal(toMinorUnits(450, "USD"), 45_000);
    assert.equal(fromMinorUnits(45_000, "USD"), 450);
  });

  it("leaves zero-decimal currencies untouched", () => {
    assert.equal(toMinorUnits(4500, "JPY"), 4500);
    assert.equal(fromMinorUnits(4500, "JPY"), 4500);
  });
});

describe("session tokens", () => {
  it("round-trips a valid payload", () => {
    const token = encodeSession({
      userId: "user-1",
      email: "person@company.test",
      exp: Date.now() + 60_000,
    });
    assert.equal(decodeSession(token)?.userId, "user-1");
  });

  it("rejects a tampered payload", () => {
    const token = encodeSession({
      userId: "user-1",
      email: "person@company.test",
      exp: Date.now() + 60_000,
    });
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ userId: "admin", email: "a@b.test", exp: Date.now() + 60_000 }),
    ).toString("base64url");
    assert.equal(decodeSession(`${forged}.${signature}`), null);
  });

  it("rejects an expired payload", () => {
    const token = encodeSession({
      userId: "user-1",
      email: "person@company.test",
      exp: Date.now() - 1000,
    });
    assert.equal(decodeSession(token), null);
  });
});

describe("password hashing", () => {
  it("verifies the correct password and rejects others", () => {
    const stored = hashPassword("Passw0rd123");
    assert.ok(stored.startsWith("scrypt:"));
    assert.ok(!stored.includes("Passw0rd123"));
    assert.equal(verifyPassword("Passw0rd123", stored), true);
    assert.equal(verifyPassword("Passw0rd124", stored), false);
  });
});

describe("order status transitions", () => {
  it("allows only forward or cancelling moves", () => {
    assert.deepEqual(allowedOrderTransitions.pending, ["confirmed", "cancelled"]);
    assert.deepEqual(allowedOrderTransitions.completed, []);
    assert.ok(!allowedOrderTransitions.pending.includes("completed"));
  });
});

describe("service validation", () => {
  const base = {
    title: "Agent Workflow Audit",
    description: "A structured review of an existing automation workflow.",
    technologies: ["LangGraph"],
    pricingType: "fixed" as const,
    icon: "agents" as const,
    isActive: true,
    featured: false,
    sortOrder: 0,
    currency: "USD",
  };

  it("requires a positive price for fixed pricing", () => {
    assert.equal(serviceInputSchema.safeParse({ ...base, price: 0 }).success, false);
    assert.equal(serviceInputSchema.safeParse({ ...base, price: 450 }).success, true);
  });

  it("refuses a price on custom quote services", () => {
    const result = serviceInputSchema.safeParse({
      ...base,
      pricingType: "custom",
      price: 450,
    });
    assert.equal(result.success, false);
  });

  it("rejects unsupported currencies", () => {
    assert.equal(
      serviceInputSchema.safeParse({ ...base, price: 10, currency: "XYZ" }).success,
      false,
    );
  });

  it("supports partial updates", () => {
    assert.equal(serviceUpdateSchema.safeParse({ isActive: false }).success, true);
  });
});

describe("project validation", () => {
  const base = {
    title: "Multi-Agent Automation",
    category: "Multi-Agent Systems",
    description: "A concept system splitting work across specialised agents.",
    technologies: ["LangGraph"],
    featured: false,
    isPublished: false,
    sortOrder: 0,
  };

  it("rejects dangerous or non-public URLs", () => {
    assert.equal(
      projectInputSchema.safeParse({ ...base, liveUrl: "javascript:alert(1)" }).success,
      false,
    );
    assert.equal(
      projectInputSchema.safeParse({ ...base, liveUrl: "http://localhost:3000" }).success,
      false,
    );
  });

  it("accepts an empty URL and a real https URL", () => {
    assert.equal(projectInputSchema.safeParse({ ...base, liveUrl: "" }).success, true);
    assert.equal(
      projectInputSchema.safeParse({ ...base, githubUrl: "https://github.com/a/b" }).success,
      true,
    );
  });
});

describe("phone country codes", () => {
  it("composes an international number and parses it back", async () => {
    const { composePhone, parsePhone } = await import("@/lib/phone");
    assert.equal(composePhone("+92", "0306 664 4221"), "+923066644221");
    assert.equal(composePhone("+92", ""), "");
    const parsed = parsePhone("+44 7700 900123");
    assert.equal(parsed.dial, "+44");
    assert.equal(parsed.national, "7700900123");
    assert.equal(parsePhone("").dial, "+92");
  });
});

describe("contact validation", () => {
  it("requires a real email and a message of usable length", () => {
    assert.equal(
      contactSchema.safeParse({ name: "Ayesha", email: "nope", message: "hello there" })
        .success,
      false,
    );
    assert.equal(
      contactSchema.safeParse({
        name: "Ayesha",
        email: "ayesha@company.test",
        message: "We need an agent workflow for lead triage.",
      }).success,
      true,
    );
  });
});

describe("rate limiting", () => {
  it("blocks once the window limit is reached", () => {
    const key = `unit-test-${Date.now()}`;
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    assert.equal(rateLimit(key, 2, 60_000).ok, true);
    assert.equal(rateLimit(key, 2, 60_000).ok, false);
  });
});

describe("post-login redirect", () => {
  it("keeps a same-site path", () => {
    assert.equal(safeInternalPath("/admin/orders"), "/admin/orders");
  });

  it("refuses anything that could leave the site", () => {
    assert.equal(safeInternalPath("https://attacker.test"), "/dashboard");
    assert.equal(safeInternalPath("//attacker.test"), "/dashboard");
    assert.equal(safeInternalPath("/\\attacker.test"), "/dashboard");
    assert.equal(safeInternalPath(null), "/dashboard");
  });

  it("sends customers home instead of dashboard or admin", () => {
    assert.equal(postLoginPath("USER", null), "/");
    assert.equal(postLoginPath("USER", "/dashboard"), "/");
    assert.equal(postLoginPath("USER", "/dashboard/inquiries"), "/");
    assert.equal(postLoginPath("USER", "/admin"), "/");
    assert.equal(postLoginPath("USER", "/#contact"), "/#contact");
  });

  it("lets admins open dashboard after sign-in", () => {
    assert.equal(postLoginPath("ADMIN", null), "/dashboard");
    assert.equal(postLoginPath("ADMIN", "/admin/users"), "/admin/users");
  });
});

describe("sanitizing", () => {
  it("strips markup from submitted text", () => {
    assert.equal(sanitizeText("<script>alert(1)</script>Ayesha"), "alert(1)Ayesha");
    assert.equal(sanitizeMultiline("<b>line</b>"), "line");
  });
});

describe("n8n signatures and automation catalog", () => {
  it("accepts a correctly signed payload and rejects a tampered one", async () => {
    const { signN8nPayload, verifyN8nSignature } = await import("@/lib/n8n/signature");
    const secret = "n8n-test-secret-value";
    const body = '{"event":"inquiry.created"}';
    const timestamp = "1700000000000";
    const signature = signN8nPayload(secret, body, timestamp);
    assert.equal(verifyN8nSignature(secret, body, timestamp, signature, 1_700_000_000_000), true);
    assert.equal(
      verifyN8nSignature(secret, `${body} `, timestamp, signature, 1_700_000_000_000),
      false,
    );
  });

  it("exposes the five product webhooks", async () => {
    const { AUTOMATION_PRODUCT_IDS, businessAutomations, isAutomationProductId } =
      await import("@/data/automations");
    assert.equal(AUTOMATION_PRODUCT_IDS.length, 5);
    assert.equal(businessAutomations.length, 5);
    for (const id of AUTOMATION_PRODUCT_IDS) {
      assert.equal(isAutomationProductId(id), true);
      assert.equal(businessAutomations.some((item) => item.id === id), true);
    }
    assert.equal(isAutomationProductId("rm_rf"), false);
  });
});

describe("FastAPI backend URL", () => {
  it("strips a trailing slash", async () => {
    const { backendBaseUrl } = await import("@/lib/env");
    assert.equal(backendBaseUrl().endsWith("/"), false);
  });
});

describe("client agent page awareness", () => {
  it("maps hashes to portfolio sections and hides app routes", async () => {
    const {
      isClientAgentHiddenPath,
      sectionFromHash,
      suggestionsForSection,
    } = await import("@/lib/client-agent/config");
    assert.equal(sectionFromHash("#projects"), "projects");
    assert.equal(sectionFromHash("#about"), "about");
    assert.equal(sectionFromHash(""), "home");
    assert.equal(isClientAgentHiddenPath("/dashboard"), true);
    assert.equal(isClientAgentHiddenPath("/login"), true);
    assert.equal(isClientAgentHiddenPath("/admin-login"), true);
    assert.equal(isClientAgentHiddenPath("/auth/confirm"), true);
    assert.equal(isClientAgentHiddenPath("/"), false);
    assert.match(suggestionsForSection("contact")[0] ?? "", /start a project/i);
    assert.match(suggestionsForSection("services")[0] ?? "", /service/i);
  });
});

describe("auth confirm URL", () => {
  it("points confirmation emails back at this app", async () => {
    const { authConfirmUrl } = await import("@/lib/env");
    assert.equal(authConfirmUrl().endsWith("/auth/confirm"), true);
  });
});

describe("app nav active path", () => {
  it("does not mark Overview current on nested dashboard routes", async () => {
    const { isActivePath } = await import("@/components/app/AppNav");
    const hrefs = ["/dashboard", "/dashboard/platform", "/dashboard/inquiries"];
    assert.equal(isActivePath("/dashboard", "/dashboard", hrefs), true);
    assert.equal(isActivePath("/dashboard/platform", "/dashboard", hrefs), false);
    assert.equal(isActivePath("/dashboard/platform", "/dashboard/platform", hrefs), true);
    assert.equal(
      isActivePath("/dashboard/inquiries/abc", "/dashboard/inquiries", hrefs),
      true,
    );
  });
});

describe("inquiry thank-you copy", () => {
  it("builds a service reply without inventing a reference", async () => {
    const {
      firstName,
      inquiryReplySubject,
      inquiryReplyText,
    } = await import("@/lib/mail/inquiry-reply");
    assert.equal(firstName("Ayesha Khan"), "Ayesha");
    assert.match(inquiryReplySubject(), /Thank you/i);
    const text = inquiryReplyText({
      name: "Ayesha Khan",
      serviceTitle: "AI Agents",
      referenceId: "abcd1234-inquiry",
    });
    assert.match(text, /Hi Ayesha/);
    assert.match(text, /AI Agents/);
    assert.match(text, /abcd1234/);
    assert.match(text, /RAG knowledge systems/);
  });
});

describe("supabase console links", () => {
  it("points at this project dashboard", async () => {
    const { supabaseDashboardUrl, supabaseProjectRef } = await import(
      "@/lib/supabase/console"
    );
    assert.equal(supabaseProjectRef(), "wpdslwonqowelbrublju");
    assert.equal(
      supabaseDashboardUrl(),
      "https://supabase.com/dashboard/project/wpdslwonqowelbrublju",
    );
    assert.equal(
      supabaseDashboardUrl("auth/users"),
      "https://supabase.com/dashboard/project/wpdslwonqowelbrublju/auth/users",
    );
  });
});

describe("designated admin", () => {
  it("treats the site owner email as ADMIN", async () => {
    const { isDesignatedAdmin } = await import("@/lib/env");
    assert.equal(isDesignatedAdmin("nidaasghar8750@gmail.com"), true);
    assert.equal(isDesignatedAdmin("NidaAsghar8750@gmail.com"), true);
    assert.equal(isDesignatedAdmin("visitor@company.test"), false);
  });
});
