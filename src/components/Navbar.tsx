import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, ShieldCheck, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartActive = location.pathname === "/cart" || location.pathname === "/checkout";
  const cartLabel = totalItems > 0 ? `Cart (${totalItems})` : "Cart";
  const activePage = location.pathname === "/" ? "/" :
    location.pathname === "/shop" || location.pathname.startsWith("/product/") ? "/shop" :
    location.pathname === "/about" ? "/about" :
    location.pathname === "/contact" ? "/contact" : null;

  useEffect(() => { setMobileOpen(false); }, [location.key]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  return (
    <header data-scrolled={scrolled} className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${scrolled ? "border-black/10 bg-white/95 shadow-[0_2px_16px_-12px_rgba(0,0,0,0.2)] backdrop-blur-md" : "border-transparent bg-background"}`}>
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr] lg:px-12">
        <Link to="/" aria-label="Maru by Maru — Home" className="w-fit shrink-0 font-serif uppercase transition-opacity hover:opacity-60">
          <span className="flex flex-col items-center leading-none sm:hidden"><span className="text-[24px] tracking-[0.16em]">Maru</span><span className="mt-1 text-[9px] tracking-[0.3em]">By Maru</span></span>
          <span className="hidden text-[21px] tracking-[0.12em] sm:block lg:text-2xl">Maru by Maru</span>
        </Link>

        <div className="hidden h-full items-center gap-8 md:flex lg:gap-11">
          {navigation.map(({ label, to }) => {
            const active = activePage === to;
            return <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`group relative inline-flex h-full items-center px-1 text-[10px] uppercase tracking-[0.2em] transition-colors ${active ? "text-black" : "text-black/55 hover:text-black"}`}>
              {label}
              <span aria-hidden="true" className={`absolute inset-x-1 bottom-3 h-px origin-center bg-black transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"}`} />
            </Link>;
          })}
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Link to="/cart" aria-label={cartLabel} title="Your shopping bag" aria-current={cartActive ? "page" : undefined} className={`relative flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 ${cartActive ? "bg-black/5" : ""}`}>
            <ShoppingBag size={20} strokeWidth={1.25} aria-hidden="true" />
            {totalItems > 0 && <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] leading-none text-white">{totalItems > 99 ? "99+" : totalItems}</span>}
          </Link>
          <Link to="/admin" aria-label="Admin" title="Admin sign in" className="flex h-11 w-11 items-center justify-center text-black/65 transition-colors hover:bg-black/5 hover:text-black">
            <ShieldCheck size={20} strokeWidth={1.25} aria-hidden="true" />
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button type="button" aria-label="Toggle menu" className="ml-1 flex h-11 w-11 items-center justify-center border-l border-black/10 md:hidden"><Menu size={20} strokeWidth={1.25} /></button>
            </SheetTrigger>
            <SheetContent side="right" className="z-[60] flex w-full max-w-[400px] flex-col border-black/10 p-0 shadow-none [&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center">
              <div className="border-b border-black/10 px-7 pb-6 pt-8">
                <SheetTitle className="font-serif text-2xl font-normal uppercase tracking-[0.1em]">Maru by Maru</SheetTitle>
                <SheetDescription className="mt-3 text-[10px] tracking-wide">A wardrobe, considered.</SheetDescription>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
                <p className="mb-5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Explore Maru</p>
                <nav aria-label="Mobile navigation">
                  {navigation.map(({ label, to }, index) => {
                    const active = activePage === to;
                    return <SheetClose asChild key={to}><Link to={to} aria-current={active ? "page" : undefined} className={`group flex min-h-20 items-center gap-5 border-b border-black/10 py-5 ${active ? "text-black" : "text-black/55"}`}>
                      <span aria-hidden="true" className="text-[9px] tracking-wider text-black/35">0{index + 1}</span>
                      <span className={`font-serif text-4xl ${active ? "italic" : ""}`}>{label}</span>
                      <ArrowUpRight aria-hidden="true" size={19} strokeWidth={1} className={`ml-auto transition-opacity ${active ? "opacity-100" : "opacity-35 group-hover:opacity-100"}`} />
                    </Link></SheetClose>;
                  })}
                </nav>
                <div className="mt-8 flex items-center gap-6">
                  <SheetClose asChild><Link to="/cart" aria-label={cartLabel} className="flex min-h-11 items-center gap-3 text-[10px] uppercase tracking-widest"><ShoppingBag size={18} strokeWidth={1.25} />Your bag{totalItems > 0 ? ` (${totalItems})` : ""}</Link></SheetClose>
                  <SheetClose asChild><Link to="/admin" className="flex min-h-11 items-center gap-3 text-[10px] uppercase tracking-widest"><ShieldCheck size={18} strokeWidth={1.25} />Admin</Link></SheetClose>
                </div>
              </div>
              <p className="border-t border-black/10 px-7 py-6 font-serif text-xl italic text-muted-foreground">Made with intention. Worn with presence.</p>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
