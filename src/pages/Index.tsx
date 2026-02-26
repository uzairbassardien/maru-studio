import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

const reviews = [
  { name: "Amina K.", text: "The quality is unmatched. I feel so elegant every time I wear my Maru dress.", location: "Lagos" },
  { name: "Sarah M.", text: "Minimalist perfection. The silhouette is timeless and the fabric is divine.", location: "London" },
  { name: "Fatima O.", text: "I've never received so many compliments. Maru by Maru understands modern femininity.", location: "Dubai" },
  { name: "Chioma A.", text: "Simple, refined, and beautifully crafted. This is luxury without the noise.", location: "Abuja" },
];

const Index = () => {
  const featured = products.slice(0, 4);
  const newArrivals = products.filter((p) => p.category === "new");

  return (
    <div>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 text-center px-6">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-wide mb-6 animate-fade-in text-primary-foreground">
            Timeless Dresses. Pure Expression.
          </h1>
          <p className="text-sm md:text-base tracking-[0.15em] mb-10 animate-fade-in-delay text-primary-foreground">
            Designed for simplicity. Crafted for presence.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase px-10 py-4 transition-opacity duration-300 hover:opacity-80 animate-fade-in-delay-2"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="px-6 md:px-12 py-20 md:py-28">
        <h2 className="font-serif text-3xl md:text-4xl tracking-wide text-center mb-16">
          The Collection
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-16">
          <Link
            to="/shop"
            className="text-xs tracking-[0.25em] uppercase hover-underline"
          >
            View All
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="px-6 md:px-12 py-20 md:py-28 border-t border-foreground/10">
          <h2 className="font-serif text-3xl md:text-4xl tracking-wide text-center mb-16">
            New Arrivals
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="px-6 md:px-12 py-20 md:py-28 border-t border-foreground/10">
        <h2 className="font-serif text-3xl md:text-4xl tracking-wide text-center mb-16">
          What Our Clients Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {reviews.map((review, i) => (
            <div key={i} className="text-center md:text-left">
              <p className="font-serif text-lg md:text-xl leading-relaxed mb-6 italic">
                "{review.text}"
              </p>
              <p className="text-xs tracking-[0.2em] uppercase">
                {review.name} — {review.location}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Story */}
      <section className="px-6 md:px-12 py-20 md:py-28 border-t border-foreground/10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-serif text-2xl md:text-3xl tracking-wide leading-relaxed">
            Maru by Maru creates refined silhouettes for modern women.
          </p>
          <Link
            to="/about"
            className="inline-block mt-10 text-xs tracking-[0.25em] uppercase hover-underline"
          >
            Our Story
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
