import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link to="/" className="font-serif text-xl md:text-2xl tracking-widest uppercase">
          Maru by Maru
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10 text-xs tracking-[0.2em] uppercase">
          <Link to="/shop" className="hover-underline">Shop</Link>
          <Link to="/about" className="hover-underline">About</Link>
          <Link to="/cart" className="hover-underline">
            Cart{totalItems > 0 && ` (${totalItems})`}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-foreground/10 px-6 py-8 animate-fade-in">
          <div className="flex flex-col gap-6 text-sm tracking-[0.2em] uppercase">
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="hover-underline">Shop</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="hover-underline">About</Link>
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="hover-underline">
              Cart{totalItems > 0 && ` (${totalItems})`}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
