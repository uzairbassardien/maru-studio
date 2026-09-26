import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight, Boxes, ExternalLink, LayoutDashboard, LogOut, Menu, Plus, ShoppingBag } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const mobileNavigation = [
  { label: "Dashboard", to: "/admin" },
  { label: "Products", to: "/admin/products" },
  { label: "Add product", to: "/admin/products/new" },
  { label: "Orders", to: "/admin/orders" },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 border-l-2 px-4 py-3 text-xs uppercase tracking-[0.18em] transition-colors ${
    isActive
      ? "border-white bg-white text-black"
      : "border-transparent text-white/70 hover:border-white/50 hover:text-white"
  }`;

const AdminLayout = () => {
  const { user, signOut } = useAdminAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activePage = location.pathname === "/admin/products/new" ? "/admin/products/new" :
    location.pathname.startsWith("/admin/products") ? "/admin/products" :
    location.pathname.startsWith("/admin/orders") ? "/admin/orders" : "/admin";

  useEffect(() => { setMobileOpen(false); }, [location.key]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-black text-white md:flex">
        <div className="border-b border-white/15 px-7 py-7">
          <Link to="/admin" className="font-serif text-2xl tracking-[0.14em] uppercase">
            Maru
          </Link>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/50">
            Administration
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-8">
          <NavLink to="/admin" end className={navClass}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/admin/products" end className={navClass}>
            <Boxes size={16} /> Products
          </NavLink>
          <NavLink to="/admin/products/new" className={navClass}>
            <Plus size={16} /> Add product
          </NavLink>
          <NavLink to="/admin/orders" className={navClass}>
            <ShoppingBag size={16} /> Orders
          </NavLink>
        </nav>

        <div className="border-t border-white/15 p-5">
          <p className="truncate text-[11px] text-white/55">{user?.email}</p>
          <div className="mt-5 flex items-center justify-between">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/70 hover:text-white"
            >
              Store <ExternalLink size={13} />
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/70 hover:text-white"
            >
              Sign out <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur-md md:hidden">
        <nav aria-label="Admin mobile header" className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
          <Link to="/admin" aria-label="Maru by Maru — Dashboard" className="w-fit shrink-0 font-serif uppercase transition-opacity hover:opacity-60">
            <span className="flex flex-col items-center leading-none sm:hidden"><span className="text-[24px] tracking-[0.16em]">Maru</span><span className="mt-1 text-[9px] tracking-[0.3em]">By Maru</span></span>
            <span className="hidden text-[21px] tracking-[0.12em] sm:block">Maru by Maru</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[9px] uppercase tracking-[0.2em] text-black/45">Admin</span>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button type="button" aria-label="Toggle admin menu" className="flex h-11 w-11 items-center justify-center border-l border-black/10"><Menu size={20} strokeWidth={1.25} /></button>
              </SheetTrigger>
              <SheetContent side="right" className="z-[60] flex w-full max-w-[400px] flex-col border-black/10 p-0 shadow-none [&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center">
                <div className="shrink-0 border-b border-black/10 px-7 pb-6 pt-8">
                  <SheetTitle className="font-serif text-2xl font-normal uppercase tracking-[0.1em]">Maru by Maru</SheetTitle>
                  <SheetDescription className="mt-3 text-[10px] uppercase tracking-[0.2em]">Administration</SheetDescription>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
                  <p className="mb-5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Your workspace</p>
                  <nav aria-label="Admin mobile navigation">
                    {mobileNavigation.map(({ label, to }, index) => {
                      const active = activePage === to;
                      return (
                        <SheetClose asChild key={to}>
                          <Link to={to} aria-current={active ? "page" : undefined} className={`group flex min-h-20 items-center gap-4 border-b border-black/10 py-5 ${active ? "text-black" : "text-black/55"}`}>
                            <span aria-hidden="true" className="text-[9px] tracking-wider text-black/35">0{index + 1}</span>
                            <span className={`font-serif text-3xl sm:text-4xl ${active ? "italic" : ""}`}>{label}</span>
                            <ArrowUpRight aria-hidden="true" size={19} strokeWidth={1} className={`ml-auto shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-35 group-hover:opacity-100"}`} />
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  <SheetClose asChild>
                    <Link to="/" className="mt-6 inline-flex min-h-11 items-center gap-3 text-[10px] uppercase tracking-[0.18em]">Back to site<ArrowUpRight size={15} strokeWidth={1} aria-hidden="true" /></Link>
                  </SheetClose>
                </div>
                <div className="shrink-0 border-t border-black/10 px-7 py-5">
                  <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                  <SheetClose asChild>
                    <button type="button" onClick={() => void signOut()} className="mt-2 flex min-h-11 w-full items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-black/55">Logout<LogOut size={18} strokeWidth={1.25} aria-hidden="true" /></button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      <main className="min-h-screen md:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
