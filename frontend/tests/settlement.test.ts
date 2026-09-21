import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

/**
 * Settlement runs against a throwaway local store so the development data is
 * untouched. LOCAL_STORE_PATH must be set before the store module loads.
 */
let dir: string;
let repository: typeof import("@/lib/data/repository").repository;
let settlePaymentEvent: typeof import("@/lib/payments/settle").settlePaymentEvent;

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "nida-settle-"));
  process.env.LOCAL_STORE_PATH = path.join(dir, "store.json");
  process.env.DATA_STORE = "local";

  ({ repository } = await import("@/lib/data/repository"));
  ({ settlePaymentEvent } = await import("@/lib/payments/settle"));
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function seedOrder(amount = 450) {
  const user = await repository.createUser({
    id: crypto.randomUUID(),
    email: `buyer-${crypto.randomUUID()}@company.test`,
    name: "Buyer",
    role: "USER",
    status: "active",
  });

  const order = await repository.createOrder({
    userId: user.id,
    serviceId: crypto.randomUUID(),
    customerEmail: user.email,
    customerName: user.name,
    amount,
    currency: "USD",
    paymentProvider: "stripe",
    providerOrderId: `cs_${crypto.randomUUID()}`,
    paymentStatus: "processing",
    orderStatus: "pending",
  });

  return order;
}

describe("payment settlement", () => {
  it("marks a matching paid event as processed and confirms the order", async () => {
    const order = await seedOrder();
    const outcome = await settlePaymentEvent(
      "stripe",
      {
        eventId: `evt_${crypto.randomUUID()}`,
        type: "checkout.session.completed",
        providerOrderId: order.providerOrderId,
        providerPaymentId: "pi_test",
        status: "paid",
        amount: 450,
        currency: "USD",
      },
      "test",
    );

    assert.equal(outcome, "processed");
    const updated = await repository.getOrder(order.id);
    assert.equal(updated?.paymentStatus, "paid");
    assert.equal(updated?.orderStatus, "confirmed");
  });

  it("ignores a replayed event id", async () => {
    const order = await seedOrder();
    const eventId = `evt_${crypto.randomUUID()}`;
    const event = {
      eventId,
      type: "checkout.session.completed",
      providerOrderId: order.providerOrderId,
      providerPaymentId: "pi_test",
      status: "paid" as const,
      amount: 450,
      currency: "USD",
    };

    assert.equal(await settlePaymentEvent("stripe", event, "test"), "processed");
    assert.equal(await settlePaymentEvent("stripe", event, "test"), "duplicate");

    const payments = await repository.listPayments(order.userId);
    assert.equal(payments.filter((p) => p.eventId === eventId).length, 1);
  });

  it("refuses an event whose amount does not match the order", async () => {
    const order = await seedOrder(450);
    const outcome = await settlePaymentEvent(
      "stripe",
      {
        eventId: `evt_${crypto.randomUUID()}`,
        type: "checkout.session.completed",
        providerOrderId: order.providerOrderId,
        providerPaymentId: "pi_test",
        status: "paid",
        amount: 1,
        currency: "USD",
      },
      "test",
    );

    assert.equal(outcome, "amount_mismatch");
    const updated = await repository.getOrder(order.id);
    assert.notEqual(updated?.paymentStatus, "paid");
  });

  it("does not create a payment for an unknown provider order", async () => {
    const outcome = await settlePaymentEvent(
      "stripe",
      {
        eventId: `evt_${crypto.randomUUID()}`,
        type: "checkout.session.completed",
        providerOrderId: "cs_does_not_exist",
        status: "paid",
        amount: 10,
        currency: "USD",
      },
      "test",
    );

    assert.equal(outcome, "order_not_found");
  });

  it("records a failed payment without confirming the order", async () => {
    const order = await seedOrder();
    const outcome = await settlePaymentEvent(
      "stripe",
      {
        eventId: `evt_${crypto.randomUUID()}`,
        type: "payment_intent.payment_failed",
        providerOrderId: order.providerOrderId,
        status: "failed",
      },
      "test",
    );

    assert.equal(outcome, "processed");
    const updated = await repository.getOrder(order.id);
    assert.equal(updated?.paymentStatus, "failed");
    assert.equal(updated?.orderStatus, "pending");
  });
});
