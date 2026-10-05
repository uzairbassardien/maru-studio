import { amountInCents, pfItnParameterString, validItnSignature } from "./payfast.ts";

export interface PaymentOrder {
  id: string;
  total: number | string;
  status: string;
  payment_status: string;
  payment_reference: string;
}

export interface PaymentUpdate {
  payment_status: "paid" | "failed" | "cancelled";
  status?: "confirmed";
  payment_reference?: string;
  paid_at?: string;
}

interface Dependencies {
  merchantId: string;
  passphrase?: string;
  host: string;
  getOrder: (id: string) => Promise<PaymentOrder | null>;
  // Compare-and-set: update only if the total and statuses still match the read order.
  saveOrder: (order: PaymentOrder, update: PaymentUpdate) => Promise<boolean>;
  fetch: typeof fetch;
  log: (event: string, details: Record<string, string | number>) => void;
}

const response = (message: string, status = 200) => new Response(message, {
  status,
  headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createPayfastItnHandler(deps: Dependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
    let orderId = "";
    const reject = (reason: string, status = 400) => {
      // Never log the raw notification, signatures, credentials or customer fields.
      deps.log(reason, orderId ? { order_id: orderId } : {});
      return response(reason, status);
    };
    try {
      if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/x-www-form-urlencoded")) return reject("invalid_content_type", 415);
      const raw = await req.text();
      if (raw.length > 65536) return reject("notification_too_large", 413);
      const pairs = [...new URLSearchParams(raw).entries()];
      const seen = new Set<string>();
      for (const [key] of pairs) {
        if (!/^[a-zA-Z0-9_]+$/.test(key) || seen.has(key)) return reject("invalid_notification_fields");
        seen.add(key);
      }
      if (pairs[pairs.length - 1]?.[0] !== "signature") return reject("missing_or_misplaced_signature");
      const data = Object.fromEntries(pairs);
      const parameters = pfItnParameterString(pairs);
      if (!validItnSignature(parameters, data.signature, deps.passphrase)) return reject("bad_signature");
      if (data.merchant_id !== deps.merchantId) return reject("bad_merchant");
      if (!uuid.test(data.m_payment_id ?? "") || !/^\d{1,100}$/.test(data.pf_payment_id ?? "")) return reject("invalid_payment_reference");
      orderId = data.m_payment_id;
      const gross = amountInCents(data.amount_gross);
      if (gross === null) return reject("invalid_amount");

      // Validate the same parameter string with PayFast, excluding signature and
      // passphrase, per their ITN protocol. A network failure is retryable.
      const validation = await deps.fetch(`https://${deps.host}/eng/query/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: parameters,
        signal: AbortSignal.timeout(10000),
      });
      if (!validation.ok) return reject("payfast_validation_unavailable", 502);
      if ((await validation.text()).trim() !== "VALID") return reject("payfast_rejected_notification");

      const order = await deps.getOrder(orderId);
      if (!order) return reject("order_not_found", 404);
      const expected = amountInCents(order.total);
      if (expected === null || expected !== gross) return reject("amount_mismatch");

      if (order.payment_status === "paid") {
        if (data.payment_status === "COMPLETE" && order.payment_reference !== data.pf_payment_id) return reject("different_payment_for_paid_order", 409);
        deps.log("already_paid", { order_id: orderId });
        return response("ok");
      }

      let update: PaymentUpdate;
      if (data.payment_status === "COMPLETE") {
        update = {
          payment_status: "paid",
          payment_reference: data.pf_payment_id,
          paid_at: new Date().toISOString(),
          // Do not reset an order that an admin has already started fulfilling.
          ...(order.status === "new" ? { status: "confirmed" as const } : {}),
        };
      } else if (data.payment_status === "FAILED" || data.payment_status === "CANCELLED") {
        update = { payment_status: data.payment_status === "FAILED" ? "failed" : "cancelled" };
      } else {
        deps.log("ignored_payment_status", { order_id: orderId });
        return response("ok");
      }

      const saved = await deps.saveOrder(order, update);
      if (!saved) {
        const current = await deps.getOrder(orderId);
        if (current?.payment_status === "paid" && (data.payment_status !== "COMPLETE" || current.payment_reference === data.pf_payment_id)) return response("ok");
        return reject("order_changed_retry_notification", 503);
      }
      deps.log("payment_updated", { order_id: orderId, payment_status: update.payment_status });
      return response("ok");
    } catch {
      return reject("notification_processing_failed", 503);
    }
  };
}
