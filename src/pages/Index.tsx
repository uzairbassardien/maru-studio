import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import { useEffect, useRef, useState } from "react";

const reviews = [
  { name: "Amina K.", text: "The quality is unmatched. I feel so elegant every time I wear my Maru dress.", location: "Lagos" },
  { name: "Sarah M.", text: "Minimalist perfection. The silhouette is timeless and the fabric is divine.", location: "London" },
  { name: "Fatima O.", text: "I've never received so many compliments. Maru by Maru understands modern femininity.", location: "Dubai" },
  { name: "Chioma A.", text: "Simple, refined, and beautifully crafted. This is luxury without the noise.", location: "Abuja" },
];

const Index = () => {
  const featured = products.slice(0, 4);
  const newArrivals = products.filter((p) => p.category === "new");
  const featuredSkirt = products.find(
    (product) => product.id === "tia-crepe-line-wrap-skirt-black"
  );
  const brandSectionRef = useRef<HTMLDivElement>(null);
  const [isBrandVisible, setIsBrandVisible] = useState(false);

  useEffect(() => {
    const section = brandSectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsBrandVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

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

      {featuredSkirt && (
        <section className="px-4 md:px-8 py-20 md:py-28 border-t border-foreground/10">
          <div className="mx-auto max-w-[1500px]">
            <div ref={brandSectionRef} className="group relative overflow-hidden rounded-[14px] shadow-[0_22px_55px_rgba(22,22,22,0.14)]">
              <img
                src={featuredSkirt.images[0]}
                alt={featuredSkirt.name}
                className="w-full h-[360px] md:h-[500px] object-cover object-center scale-[1.16] md:scale-[1.12] transition-all duration-700 ease-out group-hover:scale-[1.2]"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(17,17,17,0.28)] via-[rgba(17,17,17,0.08)] to-[rgba(17,17,17,0.24)]" />

              <div className="absolute left-20 top-[44%] z-10 h-[220px] w-[300px] -translate-y-1/2 text-left md:left-48 md:h-[310px] md:w-[520px]">
                <p className={`${isBrandVisible ? "animate-fade-in" : "opacity-0"} absolute left-0 top-[22px] whitespace-nowrap font-serif text-7xl font-light italic leading-none tracking-[0.02em] text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.82)] md:top-[30px] md:text-9xl`}>
                  MARU
                </p>
                <p className={`${isBrandVisible ? "animate-fade-in-delay" : "opacity-0"} absolute left-2 top-[52px] z-10 whitespace-nowrap font-serif text-8xl font-light italic leading-none tracking-[0.02em] text-black/85 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)] md:left-6 md:top-[78px] md:text-[10rem]`}>
                  BY
                </p>
                <p className={`${isBrandVisible ? "animate-fade-in-delay-2" : "opacity-0"} absolute left-0 top-[104px] whitespace-nowrap font-serif text-7xl font-light italic leading-none tracking-[0.02em] text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.82)] md:top-[156px] md:text-9xl`}>
                  MARU
                </p>
                <div className="absolute left-[20%] top-[200px] -translate-x-1/2 whitespace-nowrap text-center md:top-[268px]">
                  <p className={`${isBrandVisible ? "animate-fade-in-delay-2" : "opacity-0"} font-serif text-sm font-light italic tracking-[0.14em] text-black md:text-lg`}>
                    <span className="text-white">cute.</span>
                    <span>classy.</span>
                    <span className="text-white">confidant</span>
                  </p>
                </div>
              </div>

              <Link
                to="/shop"
                className="absolute right-28 top-1/2 inline-flex -translate-y-1/2 items-center justify-center bg-[#f4efe9] px-8 py-4 text-[10px] tracking-[0.22em] uppercase text-foreground shadow-[0_12px_28px_rgba(0,0,0,0.24)] transition-all duration-300 hover:bg-foreground hover:text-background hover:shadow-[0_16px_32px_rgba(0,0,0,0.3)] md:right-56 md:px-10 md:py-5 md:text-xs"
              >
                Shop More
              </Link>
            </div>
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
