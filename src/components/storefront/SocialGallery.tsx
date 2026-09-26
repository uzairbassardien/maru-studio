import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/data/products";
import { Skeleton } from "@/components/ui/skeleton";

export default function SocialGallery({ products, loading, error }: {
  products: Product[];
  loading: boolean;
  error: boolean;
}) {
  if (error) return <p role="alert" className="py-8 text-center text-sm text-muted-foreground">The gallery is temporarily unavailable. Please try again shortly.</p>;
  if (loading) return (
    <div role="status" aria-label="Loading the Maru gallery" className="maru-gallery">
      <span className="sr-only">Loading the Maru gallery…</span>
      <div aria-hidden="true" className="maru-gallery-group">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="maru-gallery-card aspect-square rounded-none" />)}
      </div>
    </div>
  );
  if (!products.length) return <p className="py-8 text-center text-sm text-muted-foreground">New pieces will appear here soon.</p>;

  // Keep each half wider than the viewport even for a small catalogue.
  // Two identical halves, including their trailing gap, make the loop seamless.
  const copies = Math.max(1, Math.ceil(6 / products.length));
  const sequence = Array.from({ length: copies }, () => products).flat();
  const style = { "--gallery-duration": `${sequence.length * 8}s` } as CSSProperties;

  return (
    <div className="maru-gallery" aria-label="Explore the Maru collection">
      <div className="maru-gallery-track" style={style}>
        {[0, 1].map((half) => (
          <div key={half} className="maru-gallery-group" aria-hidden={half === 1 ? true : undefined}>
            {sequence.map((product, index) => {
              const duplicate = half === 1 || index >= products.length;
              return (
                <Link
                  key={`${product.id}-${index}`}
                  to={`/product/${encodeURIComponent(product.id)}`}
                  className="maru-gallery-card group block aspect-square overflow-hidden bg-muted focus-visible:outline-offset-[-4px]"
                  aria-label={`Explore ${product.name}`}
                  aria-hidden={duplicate ? true : undefined}
                  tabIndex={duplicate ? -1 : undefined}
                  data-gallery-duplicate={duplicate ? "true" : undefined}
                >
                  <img
                    src={product.images[1] || product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    width={500}
                    height={500}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.025]"
                  />
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
