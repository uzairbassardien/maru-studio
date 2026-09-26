import { Link } from "react-router-dom";

const groups = [
  { title: "Explore", links: [["Shop", "/shop"], ["About", "/about"], ["Contact", "/contact"], ["Cart", "/cart"]] },
  { title: "Customer care", links: [["Shipping & Delivery", "/shipping"], ["Returns & Exchanges", "/returns"], ["Size Guide", "/size-guide"], ["FAQ", "/faq"]] },
  { title: "Info", links: [["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"]] },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-background">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Link to="/" className="font-serif text-2xl uppercase tracking-[0.16em]">Maru by Maru</Link>
            <p className="mt-5 max-w-xs text-xs leading-6 text-muted-foreground">Refined silhouettes for modern women.<br />Made with intention. Worn with presence.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
            {groups.map((group) => <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-4 font-sans text-[10px] font-normal uppercase tracking-[0.17em]">{group.title}</h2>
              <ul className="space-y-1">
                {group.links.map(([label, to]) => <li key={to}><Link to={to} className="inline-block py-2 text-xs leading-relaxed text-muted-foreground transition-colors hover:text-black">{label}</Link></li>)}
              </ul>
            </nav>)}
          </div>
        </div>
        <p className="mt-12 border-t border-black/10 pt-6 text-[10px] leading-relaxed tracking-wide text-muted-foreground">© {new Date().getFullYear()} Maru by Maru. All rights reserved.</p>
      </div>
    </footer>
  );
}
