import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { amountInCents, payfastConfig, pfSignature } from "../_shared/payfast.ts";

const Body = z.object({
  action: z.enum(["start", "status"]),
  order_id: z.string().uuid(),
  origin: z.string().url().optional(),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { action, order_id, origin } = parsed.data;

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id, order_number, total, payment_status, customer_first_name, customer_last_name, customer_email")
      .eq("id", order_id)
      .maybeSingle();
    if (orderError) return json({ error: "Order status temporarily unavailable" }, 503);
    if (!order) return json({ error: "Order not found" }, 404);

    if (action === "status") {
      return json({ order_number: order.order_number, total: Number(order.total), payment_status: order.payment_status });
    }

    if (order.payment_status === "paid") return json({ error: "This order has already been paid." }, 400);
    const cents = amountInCents(order.total);
    if (cents === null || cents <= 0) return json({ error: "This order does not have a payable amount." }, 400);
    const config = payfastConfig((name) => Deno.env.get(name));
    if (!origin || !/^https?:\/\//.test(origin)) return json({ error: "Invalid origin" }, 400);
    const site = new URL(origin).origin;

    const fields: [string, string][] = [
      ["merchant_id", config.merchantId],
      ["merchant_key", config.merchantKey],
      ["return_url", `${site}/payment/success?order=${order.id}`],
      ["cancel_url", `${site}/payment/cancelled?order=${order.id}`],
      ["notify_url", `${Deno.env.get("SUPABASE_URL")}/functions/v1/payfast-itn`],
      ["name_first", order.customer_first_name.slice(0, 100)],
      ["name_last", order.customer_last_name.slice(0, 100)],
      ["email_address", order.customer_email],
      ["m_payment_id", order.id],
      ["amount", Number(order.total).toFixed(2)],
      ["item_name", `Maru by Maru order ${order.order_number}`],
    ];
    const signature = pfSignature(fields, config.passphrase);
    const out = Object.fromEntries(fields.filter(([, v]) => v !== ""));
    out.signature = signature;

    return json({ action: `https://${config.host}/eng/process`, fields: out });
  } catch (e) {
    console.error("PayFast checkout configuration or request failed");
    return json({ error: "Could not start payment" }, 500);
  }
});
