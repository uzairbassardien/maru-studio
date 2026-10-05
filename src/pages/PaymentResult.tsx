import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Clock3, Loader2, CircleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderStatus {
  order_number: string;
  total: number;
  payment_status: "pending" | "paid" | "failed" | "cancelled";
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);
const validOrderId = (value: string | null) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

function isOrderStatus(value: unknown): value is OrderStatus {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.order_number === "string" && typeof data.total === "number" &&
    Number.isFinite(data.total) && ["pending", "paid", "failed", "cancelled"].includes(String(data.payment_status));
}

const PaymentResult = ({ outcome }: { outcome: "success" | "cancelled" }) => {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [checking, setChecking] = useState(validOrderId(orderId));
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setOrder(null);
    setError("");
    if (!validOrderId(orderId)) {
      setChecking(false);
      setError("This payment link is missing a valid order reference. Please contact us with your order number.");
      return;
    }
    const controller = new AbortController();
    let disposed = false;
    let checks = 0;
    let timer: number | undefined;
    setChecking(true);

    const check = async () => {
      try {
        const { data, error: requestError } = await supabase.functions.invoke("payfast-checkout", {
          body: { action: "status", order_id: orderId },
          signal: controller.signal,
          timeout: 10000,
        });
        if (disposed) return;
        if (requestError || !isOrderStatus(data)) throw new Error("Status unavailable");
        setOrder(data);
        checks += 1;
        // Both return URLs are only navigation hints. Only the DB status, set by
        // the verified ITN, is evidence of payment, including on a cancelled URL.
        if (data.payment_status === "pending" && checks < 40) {
          timer = window.setTimeout(() => void check(), 3000);
        } else {
          setChecking(false);
        }
      } catch {
        if (disposed) return;
        setError("We couldn't check your payment status just now. Please try checking again.");
        setChecking(false);
      }
    };
    void check();
    return () => {
      disposed = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [orderId, outcome, retry]);

  const paid = order?.payment_status === "paid";
  const failed = order?.payment_status === "failed";
  const cancelled = order?.payment_status === "cancelled";
  const label = paid ? "Payment received" : failed ? "Payment unsuccessful" :
    cancelled ? "Payment cancelled" : error ? "Status unavailable" :
    checking ? "Confirming payment" : "Awaiting confirmation";
  const heading = paid ? "Thank you for your order." :
    failed || cancelled ? "Your payment was not completed." :
    error ? "Let’s check your payment." :
    checking ? "We’re checking your payment." : "Payment confirmation pending.";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-20 text-center md:py-24">
      <div className="w-full animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white" aria-hidden="true">
          {paid ? <Check size={24} /> : checking ? <Loader2 size={22} className="motion-safe:animate-spin" /> :
            error || failed || cancelled ? <CircleAlert size={24} /> : <Clock3 size={24} />}
        </div>
        <div role="status" aria-live="polite">
          <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-black/45">{label}</p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl">{heading}</h1>
        </div>
        {order && <p className="mt-7 text-sm leading-7 text-black/60">
          Your order number is <strong className="font-medium text-black">{order.order_number}</strong>.
          {paid ? " Your payment is confirmed." :
            failed || cancelled ? " PayFast has reported that this payment was not completed." :
            checking ? " We're waiting for PayFast's secure payment notification." :
            " We have not received payment confirmation yet."}
        </p>}
        {!paid && !error && !order && <p className="mt-7 text-sm leading-7 text-black/60">
          {outcome === "cancelled" ? "You returned from the payment screen. We’re checking the order before confirming its status." : "Please wait while we check the payment status of your order."}
        </p>}
        {error && <p role="alert" className="mt-6 text-sm leading-7 text-black/60">{error}</p>}
        {order && <p className="mt-5 font-serif text-2xl">{formatCurrency(order.total)}</p>}
        {!paid && <p className="mx-auto mt-6 max-w-md text-xs leading-6 text-black/55">
          If you’ve already paid, please don’t pay again. You can check the status again or contact us with your order number.
        </p>}
        {!paid && validOrderId(orderId) && <button
          type="button" disabled={checking} onClick={() => setRetry((value) => value + 1)}
          className="mt-7 inline-flex min-h-11 items-center border-b border-black px-3 text-[10px] uppercase tracking-[0.2em] disabled:cursor-wait disabled:opacity-50"
        >{checking ? "Checking payment…" : "Check payment again"}</button>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          <Link to="/shop" className="inline-block bg-black px-8 py-4 text-[10px] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-75">Continue shopping</Link>
          {!paid && <Link to="/contact" className="inline-flex min-h-11 items-center px-3 text-[10px] uppercase tracking-[0.2em] underline underline-offset-4">Contact us</Link>}
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
