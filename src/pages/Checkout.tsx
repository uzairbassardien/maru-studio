import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  notes: string;
}

interface PlacedOrder {
  id: string;
  order_number: string;
  total: number;
  discount?: number;
}

interface AppliedCoupon {
  code: string;
  discount: number;
}

const initialCustomer: CustomerDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "South Africa",
  notes: "",
};

const inputClass =
  "w-full border-0 border-b border-black/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors placeholder:text-black/25 focus:border-black";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const [customer, setCustomer] = useState(initialCustomer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const cartItemsPayload = () =>
    items.map((item) => ({ product_id: item.product.id, size: item.size, quantity: item.quantity }));

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || isApplying) return;
    if (!hasValidEmail) {
      setCoupon(null);
      setCouponError("Please fill in your email address first, then try the discount code again.");
      return;
    }
    setCouponError("");
    setIsApplying(true);
    const { data, error: couponErr } = await supabase.rpc("validate_coupon", {
      p_code: code,
      p_email: customer.email.trim(),
      p_items: cartItemsPayload(),
    });
    setIsApplying(false);
    if (couponErr) {
      setCoupon(null);
      setCouponError(couponErr.message || "This discount code could not be applied.");
      return;
    }
    const result = data as unknown as AppliedCoupon;
    setCoupon({ code: result.code, discount: Number(result.discount) });
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const discount = coupon ? Math.min(coupon.discount, totalPrice) : 0;

  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim());

  const updateField = (field: keyof CustomerDetails, value: string) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!items.length || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    const { data, error: orderError } = await supabase.rpc("place_order", {
      p_customer: {
        first_name: customer.firstName.trim(),
        last_name: customer.lastName.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        address_line_1: customer.addressLine1.trim(),
        address_line_2: customer.addressLine2.trim(),
        city: customer.city.trim(),
        province: customer.province.trim(),
        postal_code: customer.postalCode.trim(),
        country: customer.country.trim(),
        notes: customer.notes.trim(),
      },
      p_items: cartItemsPayload(),
      p_coupon_code: coupon?.code ?? null,
    });

    if (orderError) {
      const message = orderError.message || "Your order could not be placed. Please try again.";
      if (coupon && /discount code|minimum order/i.test(message)) {
        setCoupon(null);
        setCouponError(message);
      }
      setError(message);
      setIsSubmitting(false);
      return;
    }

    const result = data as unknown as PlacedOrder;
    const { data: pay, error: payError } = await supabase.functions.invoke("payfast-checkout", {
      body: { action: "start", order_id: result.id, origin: window.location.origin },
    });
    if (payError || !pay?.action) {
      setError("We couldn't connect to PayFast. Please try again in a moment.");
      setIsSubmitting(false);
      return;
    }
    clearCart();
    const form = document.createElement("form");
    form.method = "POST";
    form.action = pay.action;
    Object.entries(pay.fields as Record<string, string>).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  if (isSubmitting) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-20 text-center">
        <div role="status" aria-live="polite" className="w-full">
          <Loader2 size={28} strokeWidth={1} aria-hidden="true" className="mx-auto animate-spin text-black/60 motion-reduce:animate-none" />
          <p className="mt-8 text-[10px] uppercase tracking-[0.28em] text-black/45">Secure checkout</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">Redirecting you to PayFast...</h1>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-black/60">
            Please keep this page open while we take you to PayFast to complete your payment.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-black/45">This may take a few seconds. Please don’t refresh the page.</p>
        </div>
      </div>
    );
  }

  if (placedOrder) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-24 text-center">
        <div className="w-full animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
            <Check size={24} />
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-black/45">Order received</p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl">Thank you for your order.</h1>
          <p className="mt-7 text-sm leading-relaxed text-black/60">
            Your order number is <strong className="font-medium text-black">{placedOrder.order_number}</strong>.
            Keep it for your records. We’ll contact you using the details provided to confirm the next steps.
          </p>
          <p className="mt-5 font-serif text-2xl">{formatCurrency(placedOrder.total)}</p>
          <Link
            to="/shop"
            className="mt-10 inline-block bg-black px-10 py-4 text-xs uppercase tracking-[0.24em] text-white transition-opacity hover:opacity-75"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="px-6 py-32 text-center">
        <h1 className="font-serif text-4xl">Your cart is empty.</h1>
        <Link to="/shop" className="mt-8 inline-block border-b border-black pb-1 text-xs uppercase tracking-[0.22em]">
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
      <div className="mb-14">
        <p className="text-[10px] uppercase tracking-[0.28em] text-black/45">Checkout</p>
        <h1 className="mt-2 font-serif text-5xl md:text-6xl">Place your order</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-12">
          <section>
            <h2 className="border-b border-black pb-4 font-serif text-3xl">Contact</h2>
            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <label className="text-[10px] uppercase tracking-[0.18em]">
                First name
                <input value={customer.firstName} onChange={(event) => updateField("firstName", event.target.value)} className={inputClass} autoComplete="given-name" required maxLength={100} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em]">
                Last name
                <input value={customer.lastName} onChange={(event) => updateField("lastName", event.target.value)} className={inputClass} autoComplete="family-name" required maxLength={100} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em]">
                Email
                <input type="email" value={customer.email} onChange={(event) => updateField("email", event.target.value)} className={inputClass} autoComplete="email" required maxLength={320} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em]">
                Phone
                <input type="tel" value={customer.phone} onChange={(event) => updateField("phone", event.target.value)} className={inputClass} autoComplete="tel" required maxLength={50} />
              </label>
            </div>
          </section>

          <section>
            <h2 className="border-b border-black pb-4 font-serif text-3xl">Delivery address</h2>
            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <label className="text-[10px] uppercase tracking-[0.18em] sm:col-span-2">
                Address
                <input value={customer.addressLine1} onChange={(event) => updateField("addressLine1", event.target.value)} className={inputClass} autoComplete="address-line1" required maxLength={250} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em] sm:col-span-2">
                Apartment, suite, etc. <span className="normal-case tracking-normal text-black/35">(optional)</span>
                <input value={customer.addressLine2} onChange={(event) => updateField("addressLine2", event.target.value)} className={inputClass} autoComplete="address-line2" maxLength={250} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em]">
                City
                <input value={customer.city} onChange={(event) => updateField("city", event.target.value)} className={inputClass} autoComplete="address-level2" required maxLength={120} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em]">
                Province
                <input value={customer.province} onChange={(event) => updateField("province", event.target.value)} className={inputClass} autoComplete="address-level1" required maxLength={120} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em]">
                Postal code
                <input value={customer.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} className={inputClass} autoComplete="postal-code" required maxLength={30} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em]">
                Country
                <input value={customer.country} onChange={(event) => updateField("country", event.target.value)} className={inputClass} autoComplete="country-name" required maxLength={120} />
              </label>
              <label className="text-[10px] uppercase tracking-[0.18em] sm:col-span-2">
                Order notes <span className="normal-case tracking-normal text-black/35">(optional)</span>
                <textarea value={customer.notes} onChange={(event) => updateField("notes", event.target.value)} className={`${inputClass} resize-y`} rows={3} maxLength={1000} placeholder="Delivery instructions or anything we should know" />
              </label>
            </div>
          </section>
        </div>

        <aside>
          <div className="border border-black/15 p-6 lg:sticky lg:top-24">
            <h2 className="font-serif text-3xl">Your order</h2>
            <div className="mt-6 divide-y divide-black/10 border-y border-black/10">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-4 py-5">
                  <div className="relative h-24 w-16 flex-none overflow-hidden bg-black/5">
                    <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                    <span className="absolute right-0 top-0 bg-black px-1.5 py-0.5 text-[9px] text-white">{item.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg leading-tight">{item.product.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-black/45">Size {item.size}</p>
                    <p className="mt-3 text-xs">{formatCurrency(item.product.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-b border-black/10 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em]">Discount code</p>
              {!hasValidEmail ? (
                <div className="mt-3 border border-black/30 p-4 text-xs leading-relaxed">
                  <p className="font-medium uppercase tracking-[0.15em]">One step first</p>
                  <p className="mt-2 text-black/60">
                    Please enter your email address in the Contact section above. Your email is
                    needed to confirm the discount code is yours to use, then this box unlocks.
                  </p>
                </div>
              ) : coupon ? (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="uppercase tracking-[0.15em]">{coupon.code} applied</span>
                  <button type="button" onClick={removeCoupon} className="border-b border-black pb-0.5 uppercase tracking-[0.15em] hover:opacity-60">Remove</button>
                </div>
              ) : (
                <div className="mt-2 flex items-end gap-3">
                  <input
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void applyCoupon(); } }}
                    className={`${inputClass} uppercase`}
                    placeholder="Enter code"
                    maxLength={50}
                    aria-label="Discount code"
                  />
                  <button type="button" onClick={() => void applyCoupon()} disabled={!couponInput.trim() || isApplying} className="border border-black px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-60 disabled:opacity-30">
                    {isApplying ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {couponError && <p role="alert" className="mt-3 text-xs leading-relaxed">{couponError}</p>}
            </div>
            <div className="space-y-3 py-6">
              {coupon && (
                <>
                  <div className="flex justify-between text-xs"><span className="uppercase tracking-[0.2em]">Subtotal</span><span>{formatCurrency(totalPrice)}</span></div>
                  <div className="flex justify-between text-xs"><span className="uppercase tracking-[0.2em]">Discount</span><span>−{formatCurrency(discount)}</span></div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em]">Total</span>
                <span className="font-serif text-2xl">{formatCurrency(totalPrice - discount)}</span>
              </div>
            </div>
            <p className="mb-5 text-[10px] leading-relaxed text-black/45">
              Final pricing is verified when the order is submitted. You'll be taken to PayFast to complete payment securely.
            </p>
            {error && <div role="alert" className="mb-5 border border-black p-4 text-xs leading-relaxed">{error}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 bg-black px-6 py-4 text-xs uppercase tracking-[0.23em] text-white transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting ? "Redirecting to PayFast" : "Pay securely with PayFast"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;
