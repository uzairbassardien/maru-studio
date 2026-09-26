import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { useAdminOrders } from "@/hooks/useAdminOrders";

const statuses = ["all", "new", "confirmed", "processing", "shipped", "completed", "cancelled"] as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const AdminOrders = () => {
  const { data: orders = [], isLoading, error } = useAdminOrders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesQuery =
        !normalized ||
        order.order_number.toLowerCase().includes(normalized) ||
        order.customer_email.toLowerCase().includes(normalized) ||
        `${order.customer_first_name} ${order.customer_last_name}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  const openCount = orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length;
  const newCount = orders.filter((order) => order.status === "new").length;

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-black/45">Sales</p>
        <h1 className="mt-2 font-serif text-5xl lg:text-6xl">Orders</h1>
        <p className="mt-3 text-sm text-black/50">Track customer orders from placement to completion.</p>
      </div>

      <div className="mt-10 grid grid-cols-3 border border-black/10 bg-white">
        {[["Total", orders.length], ["Open", openCount], ["New", newCount]].map(([label, value], index) => (
          <div key={label} className={`p-5 sm:p-7 ${index > 0 ? "border-l border-black/10" : ""}`}>
            <p className="text-[9px] uppercase tracking-[0.22em] text-black/45">{label}</p>
            <p className="mt-2 font-serif text-3xl sm:text-4xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-5 border-b border-black/15 pb-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order, customer or email"
            className="w-full border-0 border-b border-black/25 bg-transparent py-3 pl-7 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {statuses.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`px-3 py-2 text-[9px] uppercase tracking-[0.16em] ${
                status === option ? "bg-black text-white" : "bg-white text-black/50 hover:text-black"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-24 text-xs uppercase tracking-[0.2em]">
          <Loader2 size={17} className="animate-spin" /> Loading orders
        </div>
      )}

      {error && (
        <div className="my-10 border border-black bg-white p-6 text-sm">
          <p>Orders could not be loaded.</p>
          <p className="mt-2 text-black/50">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && filteredOrders.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-serif text-3xl">No orders found</p>
          <p className="mt-3 text-sm text-black/45">New customer orders will appear here.</p>
        </div>
      )}

      {!isLoading && !error && filteredOrders.length > 0 && (
        <div className="divide-y divide-black/10">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/admin/orders/${order.id}`}
              className="grid grid-cols-[1fr_auto] items-center gap-5 py-6 transition-opacity hover:opacity-60 sm:grid-cols-[1.1fr_1.5fr_1fr_1fr_auto]"
            >
              <div>
                <p className="font-serif text-xl">{order.order_number}</p>
                <p className="mt-1 text-[10px] text-black/40 sm:hidden">{formatDate(order.created_at)}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm">{order.customer_first_name} {order.customer_last_name}</p>
                <p className="mt-1 text-[10px] text-black/40">{order.customer_email}</p>
              </div>
              <p className="hidden text-xs text-black/55 sm:block">{formatDate(order.created_at)}</p>
              <div className="text-right sm:text-left">
                <p className="text-sm">{formatCurrency(order.total)}</p>
                <span className="mt-2 inline-block bg-black px-2 py-1 text-[8px] uppercase tracking-[0.16em] text-white">
                  {order.status}
                </span>
              </div>
              <ChevronRight size={17} className="hidden sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

