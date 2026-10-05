import { createClient } from "npm:@supabase/supabase-js@2";
import { payfastConfig } from "../_shared/payfast.ts";
import { createPayfastItnHandler } from "../_shared/payfast-itn-handler.ts";

// Public server-to-server endpoint. JWT verification is disabled in config.toml;
// the handler authenticates the notification with its signature and PayFast.
Deno.serve(async (req) => {
  try {
    const config = payfastConfig((name) => Deno.env.get(name));
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    return await createPayfastItnHandler({
      ...config,
      fetch,
      log: (event, details) => console.info(JSON.stringify({ service: "payfast-itn", event, ...details })),
      getOrder: async (id) => {
        const { data, error } = await db.from("orders")
          .select("id, total, status, payment_status, payment_reference").eq("id", id).maybeSingle();
        if (error) throw new Error("Order read failed");
        return data;
      },
      saveOrder: async (order, update) => {
        const { data, error } = await db.from("orders").update(update)
          .eq("id", order.id)
          .eq("total", order.total)
          .eq("payment_status", order.payment_status)
          .eq("status", order.status)
          .select("id");
        if (error) throw new Error("Order update failed");
        return data?.length === 1;
      },
    })(req);
  } catch {
    console.error(JSON.stringify({ service: "payfast-itn", event: "configuration_error" }));
    return new Response("configuration_error", { status: 500 });
  }
});
