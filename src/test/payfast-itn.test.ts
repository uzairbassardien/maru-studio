// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { amountInCents, payfastConfig, pfEncode, pfItnParameterString, pfSignature } from "../../supabase/functions/_shared/payfast";
import { createPayfastItnHandler, type PaymentOrder, type PaymentUpdate } from "../../supabase/functions/_shared/payfast-itn-handler";

const id = "628c0721-bd00-4000-8000-000000000001";
const passphrase = "test-passphrase";
// Protocol fixture, deliberately including empty optional fields and whitespace.
// Its expected signature is built from this literal, not our serializer.
const parameters = `m_payment_id=${id}&pf_payment_id=1234567&payment_status=COMPLETE&item_name=Maru+order&item_description=&amount_gross=650.00&amount_fee=-14.95&amount_net=635.05&custom_str1=&custom_int1=&name_first=+Test+&name_last=Buyer&email_address=test%40example.com&merchant_id=10000100`;

function signedRequest(body = parameters, phrase = passphrase) {
  const signature = createHash("md5").update(`${body}&passphrase=${phrase}`).digest("hex");
  return new Request("https://example.test/itn", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `${body}&signature=${signature}`,
  });
}

function fixture(overrides: Partial<PaymentOrder> = {}) {
  const order: PaymentOrder & { paid_at?: string } = {
    id, total: 650, status: "new", payment_status: "pending", payment_reference: "", ...overrides,
  };
  const deps = {
    merchantId: "10000100", passphrase, host: "sandbox.payfast.co.za",
    getOrder: vi.fn(async () => ({ ...order })),
    saveOrder: vi.fn(async (expected: PaymentOrder, update: PaymentUpdate) => {
      if (expected.payment_status !== order.payment_status || expected.status !== order.status || expected.total !== order.total) return false;
      Object.assign(order, update);
      return true;
    }),
    fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response("VALID")),
    log: vi.fn(),
  };
  return { order, deps, handle: createPayfastItnHandler(deps) };
}

describe("PayFast protocol", () => {
  it("reproduces and fixes the old checkout/ITN signature mismatch", async () => {
    const expected = createHash("md5").update(`${parameters}&passphrase=${passphrase}`).digest("hex");
    const pairs = [...new URLSearchParams(parameters).entries()];
    expect(pfSignature(pairs, passphrase)).not.toBe(expected);
    expect(pfItnParameterString(pairs)).toBe(parameters);
    const { handle, order, deps } = fixture();
    expect((await handle(signedRequest())).status).toBe(200);
    expect(order).toMatchObject({ payment_status: "paid", payment_reference: "1234567", status: "confirmed" });
    expect(order.paid_at).toBeTruthy();
    expect(deps.fetch).toHaveBeenCalledWith("https://sandbox.payfast.co.za/eng/query/validate", expect.objectContaining({ body: parameters }));
    expect(JSON.stringify(deps.log.mock.calls)).not.toContain("test@example.com");
    expect(JSON.stringify(deps.log.mock.calls)).not.toContain(passphrase);
  });

  it("encodes PHP form characters, tilde, spaces and Unicode without trimming ITNs", () => {
    expect(pfEncode(" ~!*'() café ")).toBe("+%7E%21%2A%27%28%29+caf%C3%A9+");
    expect(pfItnParameterString([["zero", "0"], ["blank", ""], ["signature", "ignored"]])).toBe("zero=0&blank=");
    expect(pfSignature([["item_name", " Maru "], ["empty", ""]])).toBe(createHash("md5").update("item_name=Maru").digest("hex"));
  });

  it("supports an ITN without a configured passphrase", async () => {
    const { deps } = fixture();
    const handler = createPayfastItnHandler({ ...deps, passphrase: undefined });
    const signature = createHash("md5").update(parameters).digest("hex");
    const req = new Request("https://example.test", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `${parameters}&signature=${signature}` });
    expect((await handler(req)).status).toBe(200);
  });

  it("selects sandbox/live only from explicit server configuration", () => {
    const env: Record<string, string> = { PAYFAST_MERCHANT_ID: "10000100", PAYFAST_MERCHANT_KEY: "test-key" };
    expect(payfastConfig((key) => env[key]).host).toBe("sandbox.payfast.co.za");
    env.PAYFAST_SANDBOX = "false";
    expect(payfastConfig((key) => env[key]).host).toBe("www.payfast.co.za");
    env.PAYFAST_SANDBOX = "typo";
    expect(() => payfastConfig((key) => env[key])).toThrow();
    expect(() => payfastConfig(() => undefined)).toThrow();
  });
});

describe("ITN rejection and retry handling", () => {
  it("rejects a bad signature before any external call or database write", async () => {
    const { handle, deps } = fixture();
    expect((await handle(signedRequest(parameters, "wrong-passphrase"))).status).toBe(400);
    expect(deps.fetch).not.toHaveBeenCalled();
    expect(deps.saveOrder).not.toHaveBeenCalled();
  });

  it("rejects duplicate fields and a different merchant", async () => {
    for (const body of [`${parameters}&amount_gross=1.00`, parameters.replace("merchant_id=10000100", "merchant_id=10000999")]) {
      const { handle, deps } = fixture();
      expect((await handle(signedRequest(body))).status).toBe(400);
      expect(deps.saveOrder).not.toHaveBeenCalled();
    }
  });

  it.each(["", "NaN", "Infinity", "650abc", "-650.00", "649.99", "650.01", "650.001"])("rejects malformed or mismatched gross amount %s", async (gross) => {
    const { handle, deps } = fixture();
    expect((await handle(signedRequest(parameters.replace("amount_gross=650.00", `amount_gross=${gross}`)))).status).toBe(400);
    expect(deps.saveOrder).not.toHaveBeenCalled();
  });

  it("compares exact integer cents", () => {
    expect(amountInCents("0.29")).toBe(29);
    expect(amountInCents(650)).toBe(65000);
    expect(amountInCents("650.0")).toBe(65000);
    expect(amountInCents(undefined)).toBeNull();
    expect(amountInCents("999999999999999999")).toBeNull();
  });

  it("requires PayFast server confirmation", async () => {
    const { handle, deps } = fixture();
    deps.fetch.mockResolvedValueOnce(new Response("INVALID"));
    expect((await handle(signedRequest())).status).toBe(400);
    expect(deps.saveOrder).not.toHaveBeenCalled();
  });

  it("returns retryable failures for PayFast outages and failed DB reads/writes", async () => {
    const upstream = fixture();
    upstream.deps.fetch.mockResolvedValueOnce(new Response("outage", { status: 503 }));
    expect((await upstream.handle(signedRequest())).status).toBe(502);
    const network = fixture();
    network.deps.fetch.mockRejectedValueOnce(new Error("timeout"));
    expect((await network.handle(signedRequest())).status).toBe(503);
    const read = fixture();
    read.deps.getOrder.mockRejectedValueOnce(new Error("DB unavailable"));
    expect((await read.handle(signedRequest())).status).toBe(503);
    const write = fixture();
    write.deps.saveOrder.mockRejectedValueOnce(new Error("DB unavailable"));
    expect((await write.handle(signedRequest())).status).toBe(503);
    expect(write.order.payment_status).toBe("pending");
  });
});

describe("ITN idempotency and fulfilment", () => {
  it("does not repeat updates or paid timestamps for duplicate notifications", async () => {
    const { handle, deps, order } = fixture();
    await handle(signedRequest());
    const paidAt = order.paid_at;
    deps.fetch.mockResolvedValueOnce(new Response("VALID"));
    expect((await handle(signedRequest())).status).toBe(200);
    expect(deps.saveOrder).toHaveBeenCalledTimes(1);
    expect(order.paid_at).toBe(paidAt);
  });

  it.each(["FAILED", "CANCELLED"])("does not downgrade paid orders on late %s", async (status) => {
    const { handle, deps, order } = fixture({ payment_status: "paid", payment_reference: "1234567", status: "shipped" });
    expect((await handle(signedRequest(parameters.replace("COMPLETE", status)))).status).toBe(200);
    expect(deps.saveOrder).not.toHaveBeenCalled();
    expect(order.status).toBe("shipped");
  });

  it.each(["processing", "shipped", "completed", "cancelled"])("preserves fulfilment status %s when payment completes", async (status) => {
    const { handle, order } = fixture({ status });
    expect((await handle(signedRequest())).status).toBe(200);
    expect(order.status).toBe(status);
    expect(order.payment_status).toBe("paid");
  });

  it("handles a concurrent paid update without downgrading or overwriting it", async () => {
    const { handle, deps, order } = fixture();
    deps.saveOrder.mockImplementationOnce(async () => {
      order.payment_status = "paid";
      order.payment_reference = "1234567";
      return false;
    });
    expect((await handle(signedRequest(parameters.replace("COMPLETE", "FAILED")))).status).toBe(200);
    expect(order.payment_status).toBe("paid");
  });

  it("requests a retry if an admin updates the order during confirmation", async () => {
    const { handle, deps, order } = fixture();
    deps.saveOrder.mockImplementationOnce(async () => { order.status = "processing"; return false; });
    expect((await handle(signedRequest())).status).toBe(503);
    expect(order.payment_status).toBe("pending");
  });
});
