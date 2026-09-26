import { Link } from "react-router-dom";
import { ArrowUpRight, ClipboardCheck, Truck, Ruler, MessageCircle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import Hero from "@/components/storefront/Hero";
import SectionHeading from "@/components/storefront/SectionHeading";
import CategoryCard from "@/components/storefront/CategoryCard";
import ProductGrid from "@/components/storefront/ProductGrid";
import NewsletterSection from "@/components/storefront/NewsletterSection";
import SocialGallery from "@/components/storefront/SocialGallery";
import { Skeleton } from "@/components/ui/skeleton";
import brandImage from "@/assets/about.png";

// Existing editorial testimonials, retained without unconfirmed verification claims.
const reviews = [
  {
    name: "Amina K.",
    text: "The quality is unmatched. I feel so elegant every time I wear my Maru dress.",
    location: "Lagos",
  },
  {
    name: "Sarah M.",
    text: "Minimalist perfection. The silhouette is timeless and the fabric is divine.",
    location: "London",
  },
  {
    name: "Fatima O.",
    text: "I've never received so many compliments. Maru by Maru understands modern femininity.",
    location: "Dubai",
  },
];
const benefits = [
  {
    icon: ClipboardCheck,
    title: "Thoughtful ordering",
    text: "A personal order confirmation",
    action: "How it works",
    to: "/faq",
  },
  {
    icon: Truck,
    title: "Delivery details",
    text: "Know what to expect",
    action: "Delivery information",
    to: "/shipping",
  },
  {
    icon: Ruler,
    title: "Find your fit",
    text: "Explore our size guide",
    action: "View size guide",
    to: "/size-guide",
  },
  {
    icon: MessageCircle,
    title: "Customer care",
    text: "Guidance for your Maru pieces",
    action: "Get in touch",
    to: "/contact",
  },
];
const sectionClass = "store-section";
const textLink =
  "inline-flex min-h-11 items-center py-3 text-[10px] uppercase tracking-[0.22em] hover-underline";

export default function Index() {
  const { data: products = [], isLoading, isError } = useProducts();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();
  const newArrivals = products
    .filter((product) => product.category === "new")
    .slice(0, 6);
  const mostLoved = products
    .filter((product) => product.isFeatured || product.isBestseller)
    .slice(0, 4);
  const editorialProduct = products.find(
    (product) => product.id === "tia-crepe-line-wrap-skirt-black",
  );

  return (
    <div>
      <Hero />

      <section className={sectionClass} aria-label="Shop by category">
        <SectionHeading
          title="The Collection"
          eyebrow="A wardrobe, considered"
        />
        {categoriesError ? (
          <p role="alert" className="text-center text-sm">
            Collections are temporarily unavailable. Please try again shortly.
          </p>
        ) : categoriesLoading || isLoading ? (
          <div role="status" aria-label="Loading collections">
            <span className="sr-only">Loading collections…</span>
            <div
              aria-hidden="true"
              className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index}>
                  <Skeleton className="mb-4 aspect-[3/4] w-full rounded-none" />
                  <Skeleton className="h-8 w-2/3 rounded-none" />
                  <Skeleton className="mt-4 h-3 w-16 rounded-none" />
                </div>
              ))}
            </div>
          </div>
        ) : categories.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-5">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                className={category.slug === "accessories" ? "hidden md:block" : undefined}
                image={
                  products.find(
                    (product) =>
                      product.categoryId === category.id &&
                      product.images.length,
                  )?.images[0]
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Our collections are being prepared.
          </p>
        )}
      </section>

      <section
        className={`${sectionClass} border-t border-black/10`}
        id="new-arrivals"
      >
        <SectionHeading
          title="New Arrivals"
          subtitle="The latest additions to your everyday expression."
        />
        {/* Three columns at the same card width as the four-column Most Loved grid. */}
        <div className="mx-auto lg:w-[calc(75%-0.375rem)]">
          <ProductGrid
            products={newArrivals}
            columns={3}
            skeletonCount={6}
            loading={isLoading}
            error={isError}
          />
        </div>
        <div className="mt-8 text-center">
          <Link to="/shop?collection=new" className={textLink}>
            View all new arrivals →
          </Link>
        </div>
      </section>

      <section
        className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12"
        aria-label="Maru editorial"
      >
        <div className="relative overflow-hidden bg-muted">
          <img
            src={
              editorialProduct?.images[0] ||
              "/TIA_Crepe%20Line%20Wrap_Skirt-black500.JPEG"
            }
            alt="The Maru by Maru wrap skirt editorial"
            width={1500}
            height={850}
            loading="lazy"
            className="h-[480px] w-full object-cover object-center md:h-[600px]"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-between p-7 text-center text-white sm:p-12 md:items-stretch md:text-left lg:flex-row lg:items-end lg:p-16">
            <p className="font-serif text-[clamp(3.5rem,8vw,7.5rem)] font-light italic leading-[0.83] tracking-tight">
              MARU
              <br />
              <span className="md:ml-8">BY</span>
              <br />
              MARU
            </p>
            <div className="max-w-xs lg:pb-2">
              <h2 className="font-serif text-2xl leading-snug sm:text-3xl">
                Designed for the woman who dresses with intention.
              </h2>
              <Link
                to="/about"
                className="mt-4 inline-flex min-h-11 items-center border-b border-white/60 py-3 text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
              >
                Discover Maru →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionHeading
          title="Most Loved"
          subtitle="A considered selection of Maru favourites."
        />
        <ProductGrid products={mostLoved} loading={isLoading} error={isError} />
        <div className="mt-8 text-center">
          <Link to="/shop" className={textLink}>
            Shop all →
          </Link>
        </div>
      </section>

      <section
        className={`${sectionClass} border-t border-black/10`}
        aria-label="Our story"
      >
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">
          <img
            src={brandImage}
            alt="Maru by Maru — an appreciation for craft and simplicity"
            width={800}
            height={1000}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover grayscale"
          />
          <div className="max-w-md py-2 md:py-10">
            <p className="mb-5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Maru by Maru
            </p>
            <h2 className="font-serif text-4xl leading-tight lg:text-5xl">
              Refined silhouettes for modern women.
            </h2>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
              Created with an appreciation for timeless design, effortless
              femininity and pieces that feel as beautiful as they look.
            </p>
            <Link to="/about" className={`${textLink} mt-6`}>
              Our story →
            </Link>
          </div>
        </div>
      </section>

      <section className={`${sectionClass} border-t border-black/10`}>
        <SectionHeading title="What Our Clients Say" />
        <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
          {reviews.map((review) => (
            <figure key={review.name} className="border border-black/20 px-6 py-8 text-center">
              <blockquote className="font-serif text-2xl italic leading-relaxed">
                “{review.text}”
              </blockquote>
              <figcaption className="mt-6 text-[9px] uppercase leading-6 tracking-[0.18em]">
                {review.name}
                <span className="block text-muted-foreground">
                  {review.location}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} border-t border-black/10`}>
        <SectionHeading
          title="The Maru Woman"
          subtitle="Follow the world of Maru."
        />
        <SocialGallery products={products} loading={isLoading} error={isError} />
        {/* Activate only after the business supplies its verified profile URL. */}
        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Follow @marubymaru →
        </p>
      </section>

      <section
        className="border-t border-black/10 bg-muted/30"
        aria-label="Shopping with Maru"
      >
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 md:py-20 lg:px-12">
          <div className="mb-9 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Shopping with Maru</p>
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">The details, <span className="italic">considered.</span></h2>
            </div>
            <p className="max-w-64 text-xs leading-6 text-muted-foreground">A little guidance, every step of the way.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-12">
            {benefits.map(({ icon: Icon, title, text, action, to }, index) => (
              <Link key={title} to={to} className="group flex min-w-0 flex-col border-t border-black/20 pt-5 transition-colors duration-300 hover:border-black">
                <div className="mb-6 flex items-center justify-between">
                  <Icon size={23} strokeWidth={1} className="text-black/70 transition-colors group-hover:text-black" />
                  <span aria-hidden="true" className="font-serif text-lg italic text-black/35">0{index + 1}</span>
                </div>
                <h3 className="font-serif text-2xl leading-tight sm:text-[28px]">{title}</h3>
                <p className="mb-5 mt-3 max-w-52 text-xs leading-6 text-muted-foreground">{text}</p>
                <span className="mt-auto flex min-h-11 items-center justify-between gap-2 text-[9px] uppercase leading-5 tracking-[0.1em]">
                  {action}<ArrowUpRight size={15} strokeWidth={1} className="shrink-0 transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <NewsletterSection />
    </div>
  );
}
