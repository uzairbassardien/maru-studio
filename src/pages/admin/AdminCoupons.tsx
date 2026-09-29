import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Coupon = Tables<"coupons">;

interface FormState {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  min_order_amount: string;
  starts_at: string;
  ends_at: string;
  max_uses: string;
  max_uses_per_customer: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "0",
  starts_at: "",
  ends_at: "",
  max_uses: "",
  max_uses_per_customer: "1",
  is_active: true,
};

const inputClass = "mt-1 w-full border border-black/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-black";
const labelClass = "block text-[10px] uppercase tracking-[0.18em] text-black/60";

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

const couponStatus = (c: Coupon) => {
  const now = Date.now();
  if (!c.is_active) return "Paused";
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return "Scheduled";
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return "Expired";
  return "Live";
};

const AdminCoupons = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const [coupons, redemptions] = await Promise.all([
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("coupon_redemptions").select("coupon_id, discount_amount"),
      ]);
      if (coupons.error) throw coupons.error;
      if (redemptions.error) throw redemptions.error;
      const usage = new Map<string, { count: number; total: number }>();
      for (const r of redemptions.data ?? []) {
        const u = usage.get(r.coupon_id) ?? { count: 0, total: 0 };
        u.count += 1;
        u.total += Number(r.discount_amount);
        usage.set(r.coupon_id, u);
      }
      return (coupons.data ?? []).map((c) => ({ ...c, usage: usage.get(c.id) ?? { count: 0, total: 0 } }));
    },
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const save = useMutation({
    mutationFn: async () => {
      const code = form.code.trim().toUpperCase();
      const value = Number(form.discount_value);
      const minOrder = Number(form.min_order_amount || 0);
      const perCustomer = Number(form.max_uses_per_customer);
      const maxUses = form.max_uses.trim() ? Number(form.max_uses) : null;

      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Error("Code must be 3–30 letters, numbers, dashes or underscores.");
      if (!(value > 0)) throw new Error("Enter a discount value above 0.");
      if (form.discount_type === "percentage" && value > 100) throw new Error("A percentage discount cannot exceed 100.");
      if (!(minOrder >= 0)) throw new Error("Minimum order cannot be negative.");
      if (!Number.isInteger(perCustomer) || perCustomer < 1) throw new Error("Uses per customer must be at least 1.");
      if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) throw new Error("Total uses must be a whole number above 0, or left blank.");
      const startsAt = form.starts_at ? new Date(form.starts_at).toISOString() : null;
      const endsAt = form.ends_at ? new Date(form.ends_at).toISOString() : null;
      if (startsAt && endsAt && endsAt <= startsAt) throw new Error("The end date must be after the start date.");

      const payload = {
        code,
        description: form.description.trim().slice(0, 200),
        discount_type: form.discount_type,
        discount_value: value,
        min_order_amount: minOrder,
        starts_at: startsAt,
        ends_at: endsAt,
        max_uses: maxUses,
        max_uses_per_customer: perCustomer,
        is_active: form.is_active,
      };
      const { error } = editingId
        ? await supabase.from("coupons").update(payload).eq("id", editingId)
        : await supabase.from("coupons").insert(payload);
      if (error) {
        if (error.code === "23505") throw new Error("A discount code with that name already exists.");
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Discount code updated" : "Discount code created" });
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const toggle = useMutation({
    mutationFn: async (c: Coupon) => {
      const { error } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Discount code deleted" });
      void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setFormError("");
    setForm({
      code: c.code,
      description: c.description,
      discount_type: c.discount_type as FormState["discount_type"],
      discount_value: String(c.discount_value),
      min_order_amount: String(c.min_order_amount),
      starts_at: toLocalInput(c.starts_at),
      ends_at: toLocalInput(c.ends_at),
      max_uses: c.max_uses ? String(c.max_uses) : "",
      max_uses_per_customer: String(c.max_uses_per_customer),
      is_active: c.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    save.mutate();
  };

  return (
    <div className="px-5 py-8 sm:px-10 sm:py-12">
      <p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Promotions</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Discount codes</h1>
      <p className="mt-3 max-w-xl text-sm text-black/55">
        Create a code to share on Instagram or TikTok. Each customer is tracked by email, so they can only use it as many times as you allow.
      </p>

      <form onSubmit={onSubmit} className="mt-10 border border-black/10 bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl">{editingId ? "Edit code" : "New code"}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className={labelClass}>Code
            <input className={`${inputClass} uppercase`} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="MARU10" maxLength={30} required />
          </label>
          <label className={labelClass}>Discount type
            <select className={inputClass} value={form.discount_type} onChange={(e) => set("discount_type", e.target.value as FormState["discount_type"])}>
              <option value="percentage">Percentage off (%)</option>
              <option value="fixed">Fixed amount off (R)</option>
            </select>
          </label>
          <label className={labelClass}>{form.discount_type === "percentage" ? "Percent off" : "Rand off"}
            <input type="number" min="0.01" step="0.01" className={inputClass} value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} placeholder={form.discount_type === "percentage" ? "10" : "150"} required />
          </label>
          <label className={labelClass}>Starts <span className="normal-case tracking-normal text-black/35">(optional)</span>
            <input type="datetime-local" className={inputClass} value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
          </label>
          <label className={labelClass}>Ends <span className="normal-case tracking-normal text-black/35">(optional)</span>
            <input type="datetime-local" className={inputClass} value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
          </label>
          <label className={labelClass}>Minimum order (R)
            <input type="number" min="0" step="0.01" className={inputClass} value={form.min_order_amount} onChange={(e) => set("min_order_amount", e.target.value)} />
          </label>
          <label className={labelClass}>Uses per customer
            <input type="number" min="1" step="1" className={inputClass} value={form.max_uses_per_customer} onChange={(e) => set("max_uses_per_customer", e.target.value)} required />
          </label>
          <label className={labelClass}>Total uses <span className="normal-case tracking-normal text-black/35">(blank = unlimited)</span>
            <input type="number" min="1" step="1" className={inputClass} value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} placeholder="Unlimited" />
          </label>
          <label className={labelClass}>Internal note <span className="normal-case tracking-normal text-black/35">(optional)</span>
            <input className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Instagram launch" maxLength={200} />
          </label>
        </div>
        <label className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em]">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-black" />
          Active
        </label>
        {formError && <p role="alert" className="mt-5 border border-black p-3 text-xs">{formError}</p>}
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={save.isPending} className="flex items-center gap-2 bg-black px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-white hover:opacity-75 disabled:opacity-40">
            {save.isPending && <Loader2 size={13} className="animate-spin" />}
            {editingId ? "Save changes" : "Create code"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="border border-black px-6 py-3 text-[10px] uppercase tracking-[0.22em] hover:opacity-60">Cancel</button>
          )}
        </div>
      </form>

      <div className="mt-10 overflow-x-auto border border-black/10 bg-white">
        {isLoading ? (
          <p className="p-8 text-sm text-black/50">Loading…</p>
        ) : !data?.length ? (
          <p className="p-8 text-sm text-black/50">No discount codes yet.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/10 text-[10px] uppercase tracking-[0.18em] text-black/50">
              <tr>
                <th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Valid</th>
                <th className="p-4">Used</th><th className="p-4">Given away</th><th className="p-4">Status</th><th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="p-4"><p className="font-medium tracking-wider">{c.code}</p>{c.description && <p className="text-xs text-black/45">{c.description}</p>}</td>
                  <td className="p-4">
                    {c.discount_type === "percentage" ? `${Number(c.discount_value)}%` : formatCurrency(Number(c.discount_value))}
                    {Number(c.min_order_amount) > 0 && <p className="text-xs text-black/45">min {formatCurrency(Number(c.min_order_amount))}</p>}
                  </td>
                  <td className="p-4 text-xs text-black/60">
                    {c.starts_at ? new Date(c.starts_at).toLocaleDateString("en-ZA") : "Now"} – {c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-ZA") : "No end"}
                  </td>
                  <td className="p-4">{c.usage.count}{c.max_uses ? ` / ${c.max_uses}` : ""}<p className="text-xs text-black/45">{c.max_uses_per_customer}× per customer</p></td>
                  <td className="p-4">{formatCurrency(c.usage.total)}</td>
                  <td className="p-4">
                    <button type="button" onClick={() => toggle.mutate(c)} className="border border-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] hover:border-black" title="Click to pause or resume">
                      {couponStatus(c)}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => startEdit(c)} aria-label={`Edit ${c.code}`} className="hover:opacity-50"><Pencil size={15} /></button>
                      <button type="button" aria-label={`Delete ${c.code}`} className="hover:opacity-50"
                        onClick={() => { if (window.confirm(`Delete ${c.code}? Its usage history will also be removed.`)) remove.mutate(c.id); }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
