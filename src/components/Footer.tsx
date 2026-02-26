import { Link } from "react-router-dom";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="px-6 md:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl tracking-widest uppercase mb-6">Maru by Maru</h3>
            <p className="text-xs tracking-wide leading-relaxed text-muted-foreground">
              Refined silhouettes for modern women.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-4">Navigate</p>
              <div className="flex flex-col gap-3 text-xs tracking-wide">
                <Link to="/shop" className="hover-underline inline-block">Shop</Link>
                <Link to="/about" className="hover-underline inline-block">About</Link>
                <Link to="/cart" className="hover-underline inline-block">Cart</Link>
              </div>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-4">Info</p>
              <div className="flex flex-col gap-3 text-xs tracking-wide">
                <span className="hover-underline inline-block cursor-pointer">Contact</span>
                <span className="hover-underline inline-block cursor-pointer">Instagram</span>
                <span className="hover-underline inline-block cursor-pointer">Terms & Privacy</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-4">Newsletter</p>
            {subscribed ? (
              <p className="text-xs tracking-wide">Thank you for subscribing.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 bg-transparent border-b border-foreground text-xs tracking-wide py-2 outline-none placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="submit"
                  className="text-xs tracking-[0.2em] uppercase ml-4 hover-underline"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-foreground/10 text-xs tracking-wide text-muted-foreground">
          © {new Date().getFullYear()} Maru by Maru. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
