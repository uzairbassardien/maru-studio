import type { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton } from "./ProductSkeletons";

export default function ProductGrid({ products, columns = 4, loading = false, error = false, compact = false, skeletonCount }: {
  products: Product[];
  columns?: 3 | 4;
  loading?: boolean;
  error?: boolean;
  compact?: boolean;
  skeletonCount?: number;
}) {
  if (error) return <p role="alert" className="py-10 text-center text-sm text-muted-foreground">We couldn’t load the collection. Please try again shortly.</p>;
  if (!loading && !products.length) return <p className="py-10 text-center font-serif text-xl text-muted-foreground">New pieces will appear here soon.</p>;
  return (
    <div role={loading ? "status" : undefined} aria-label={loading ? "Loading products" : undefined}>
      {loading && <span className="sr-only">Loading products…</span>}
    <div className={`grid grid-cols-2 ${compact ? "gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4" : `gap-x-4 gap-y-9 sm:gap-x-6 md:gap-y-12 ${columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}`}>
      {loading
        ? Array.from({ length: skeletonCount ?? (compact ? 8 : columns === 3 ? 6 : 4) }, (_, index) => <ProductCardSkeleton key={index} compact={compact} />)
        : products.map((product) => <ProductCard key={product.id} product={product} compact={compact} />)}
    </div>
    </div>
  );
}
