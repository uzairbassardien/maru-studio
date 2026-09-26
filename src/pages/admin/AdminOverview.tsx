import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  CircleAlert,
  Clock3,
  ExternalLink,
  Loader2,
  PackageCheck,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { useCategories } from "@/hooks/useCategories";
import { useAdminAuth } from "@/context/AdminAuthContext";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const AdminOverview = () => {
  const { user } = useAdminAuth();
  const productsQuery = useAdminProducts();
  const ordersQuery = useAdminOrders();
  const categoriesQuery = useCategories(true);

  const products = productsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const activeCategoryIds = new Set(
    categories.filter((category) => category.is_active).map((category) => category.id),
  );
  const activeProducts = products.filter((product) => product.is_active);
  const draftProducts = products.filter((product) => !product.is_active);
  const unassignedProducts = products.filter(
    (product) => !product.category_id || !activeCategoryIds.has(product.category_id),
  );
  const mostLoved = activeProducts.filter(
    (product) => product.is_featured || product.is_bestseller,
  );
  const newArrivals = activeProducts.filter((product) => product.category === "new");
  const newOrders = orders.filter((order) => order.status === "new");
  const openOrders = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  );
  const orderValue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((total, order) => total + order.total, 0);
  const categoryCoverage = products.length
    ? Math.round(((products.length - unassignedProducts.length) / products.length) * 100)
    : 0;
  const recentOrders = orders.slice(0, 5);
  const isLoading =
    productsQuery.isLoading || ordersQuery.isLoading || categoriesQuery.isLoading;
  const hasError =
    productsQuery.isError || ordersQuery.isError || categoriesQuery.isError;

  const pipeline = ["new", "confirmed", "processing", "shipped", "completed"].map(
    (status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    }),
  );
  const largestPipelineCount = Math.max(1, ...pipeline.map((item) => item.count));

  const summary = [
    {
      label: "Order value",
      value: formatCurrency(orderValue),
      note: `${orders.filter((order) => order.status !== "cancelled").length} non-cancelled orders`,
      icon: ShoppingBag,
    },
    {
      label: "New orders",
      value: newOrders.length,
      note: `${openOrders.length} currently open`,
      icon: Clock3,
    },
    {
      label: "Active products",
      value: activeProducts.length,
      note: `${draftProducts.length} saved as draft`,
      icon: Boxes,
    },
    {
      label: "Needs attention",
      value: unassignedProducts.length,
      note: "Products without an active category",
      icon: CircleAlert,
    },
  ];

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <header className="flex flex-col gap-6 border-b border-black/10 pb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-black/45">
            Maru administration
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-none lg:text-6xl">
            Welcome back.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
            A clear view of your orders, collection, and storefront readiness.
          </p>
        </div>
        <p className="max-w-full truncate text-[10px] uppercase tracking-[0.16em] text-black/40">
          {user?.email}
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-24 text-xs uppercase tracking-[0.2em]">
          <Loader2 size={17} className="animate-spin" /> Preparing dashboard
        </div>
      )}

      {hasError && !isLoading && (
        <div role="alert" className="mt-8 border border-black bg-white p-5 text-sm leading-relaxed">
          Some dashboard information could not be loaded. Use the product and order pages to retry the affected section.
        </div>
      )}

      {!isLoading && (
        <>
          <section aria-label="Business summary" className="mt-8 grid grid-cols-2 border-l border-t border-black/10 bg-white xl:grid-cols-4">
            {summary.map(({ label, value, note, icon: Icon }) => (
              <div key={label} className="min-w-0 border-b border-r border-black/10 p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-black/45">{label}</p>
                  <Icon size={16} strokeWidth={1.4} className="shrink-0 text-black/45" />
                </div>
                <p className="mt-4 break-words font-serif text-3xl leading-none sm:text-4xl">{value}</p>
                <p className="mt-3 text-[10px] leading-relaxed text-black/45">{note}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
            <div className="border border-black/10 bg-white">
              <div className="flex items-center justify-between gap-5 border-b border-black/10 p-5 sm:p-7">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">Latest activity</p>
                  <h2 className="mt-2 font-serif text-3xl">Recent orders</h2>
                </div>
                <Link to="/admin/orders" className="flex min-h-11 items-center gap-2 text-[9px] uppercase tracking-[0.18em] hover:opacity-55">
                  View all <ArrowRight size={14} />
                </Link>
              </div>

              {recentOrders.length ? (
                <div className="divide-y divide-black/10">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 transition-colors hover:bg-black/[0.025] sm:grid-cols-[1fr_1fr_auto_auto] sm:px-7"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-serif text-xl">{order.order_number}</p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-black/40 sm:hidden">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-xs">
                          {order.customer_first_name} {order.customer_last_name}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-black/40">{order.customer_email}</p>
                      </div>
                      <p className="hidden text-[10px] text-black/45 sm:block">{formatDate(order.created_at)}</p>
                      <div className="text-right">
                        <p className="text-xs">{formatCurrency(order.total)}</p>
                        <span className="mt-2 inline-block border border-black/20 px-2 py-1 text-[8px] uppercase tracking-[0.14em]">
                          {statusLabel(order.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <ShoppingBag size={22} strokeWidth={1.2} className="mx-auto text-black/30" />
                  <p className="mt-4 font-serif text-2xl">No orders yet</p>
                  <p className="mt-2 text-xs text-black/45">New customer orders will appear here.</p>
                </div>
              )}
            </div>

            <div className="border border-black/10 bg-black p-6 text-white sm:p-7">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">Order flow</p>
              <h2 className="mt-2 font-serif text-3xl">Pipeline</h2>
              <div className="mt-8 space-y-6">
                {pipeline.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between gap-3 text-[9px] uppercase tracking-[0.16em]">
                      <span className="text-white/65">{statusLabel(item.status)}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-2 h-px bg-white/20">
                      <div
                        className="h-px bg-white transition-[width] duration-500"
                        style={{ width: `${(item.count / largestPipelineCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/admin/orders" className="mt-8 inline-flex min-h-11 items-center gap-2 border-b border-white/50 py-3 text-[9px] uppercase tracking-[0.18em] hover:opacity-65">
                Manage orders <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">Catalogue health</p>
                  <h2 className="mt-2 font-serif text-3xl">Collection readiness</h2>
                </div>
                <PackageCheck size={21} strokeWidth={1.3} />
              </div>
              <div className="mt-8 flex items-end justify-between gap-5">
                <p className="font-serif text-5xl">{categoryCoverage}%</p>
                <p className="max-w-48 text-right text-[10px] leading-relaxed text-black/45">
                  {unassignedProducts.length
                    ? `${unassignedProducts.length} product${unassignedProducts.length === 1 ? " needs" : "s need"} an active category`
                    : "Every product has an active category"}
                </p>
              </div>
              <div className="mt-4 h-1 bg-black/10">
                <div className="h-1 bg-black" style={{ width: `${categoryCoverage}%` }} />
              </div>
              <dl className="mt-8 grid grid-cols-3 border-t border-black/10 pt-6 text-center">
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.14em] text-black/40">Categories</dt>
                  <dd className="mt-2 font-serif text-2xl">{activeCategoryIds.size}</dd>
                </div>
                <div className="border-x border-black/10">
                  <dt className="text-[9px] uppercase tracking-[0.14em] text-black/40">New</dt>
                  <dd className="mt-2 font-serif text-2xl">{newArrivals.length}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.14em] text-black/40">Most loved</dt>
                  <dd className="mt-2 font-serif text-2xl">{mostLoved.length}</dd>
                </div>
              </dl>
              <Link
                to={unassignedProducts.length ? "/admin/products?category=unassigned" : "/admin/products"}
                className="mt-7 inline-flex min-h-11 items-center gap-2 text-[9px] uppercase tracking-[0.18em] hover:opacity-55"
              >
                {unassignedProducts.length ? "Assign categories" : "Manage collection"} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">Shortcuts</p>
                  <h2 className="mt-2 font-serif text-3xl">Quick actions</h2>
                </div>
                <Sparkles size={21} strokeWidth={1.3} />
              </div>
              <div className="mt-7 divide-y divide-black/10 border-y border-black/10">
                {[
                  { label: "Add a new product", note: "Create and publish a new piece", to: "/admin/products/new", icon: Plus },
                  { label: "Manage products", note: "Edit categories and homepage placement", to: "/admin/products", icon: Boxes },
                  { label: "Review orders", note: `${newOrders.length} new order${newOrders.length === 1 ? "" : "s"} awaiting review`, to: "/admin/orders", icon: ShoppingBag },
                ].map(({ label, note, to, icon: Icon }) => (
                  <Link key={label} to={to} className="flex min-h-16 items-center gap-4 py-4 transition-opacity hover:opacity-55">
                    <Icon size={17} strokeWidth={1.3} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs">{label}</span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-black/40">{note}</span>
                    </span>
                    <ArrowRight size={14} className="shrink-0" />
                  </Link>
                ))}
              </div>
              <Link to="/" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 text-[9px] uppercase tracking-[0.18em] hover:opacity-55">
                View storefront <ExternalLink size={13} />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminOverview;

