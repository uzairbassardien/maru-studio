import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden="true" className="min-w-0">
      <Skeleton className="mb-4 aspect-[3/4] w-full rounded-none" />
      <Skeleton className={`w-3/4 rounded-none ${compact ? "h-5 sm:h-6" : "h-6 md:h-7"}`} />
      <Skeleton className="mt-2 h-4 w-16 rounded-none" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="px-6 py-12 md:px-12 md:py-20">
      <span className="sr-only">Loading product…</span>
      <div aria-hidden="true" className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-16">
        <Skeleton className="aspect-[3/4] w-full rounded-none" />
        <div className="flex flex-col justify-center">
          <Skeleton className="h-10 w-4/5 rounded-none" />
          <Skeleton className="mb-8 mt-3 h-5 w-20 rounded-none" />
          <div className="mb-8 space-y-3"><Skeleton className="h-4 w-full rounded-none" /><Skeleton className="h-4 w-full rounded-none" /><Skeleton className="h-4 w-2/3 rounded-none" /></div>
          <Skeleton className="mb-3 h-3 w-10 rounded-none" />
          <div className="mb-8 flex flex-wrap gap-3">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-12 rounded-none" />)}</div>
          <Skeleton className="h-12 w-full rounded-none md:max-w-xs" />
          <div className="mt-10 space-y-3"><Skeleton className="h-4 w-3/4 rounded-none" /><Skeleton className="h-4 w-1/2 rounded-none" /></div>
          <div className="mt-10 space-y-4 border-t border-black/10 pt-4">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-8 w-full rounded-none" />)}</div>
        </div>
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <div role="status" aria-label="Loading products" className="divide-y divide-black/10">
      <span className="sr-only">Loading products…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} aria-hidden="true" className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4 py-5 sm:grid-cols-[88px_minmax(0,2fr)_1fr_1fr_auto] sm:gap-6">
          <Skeleton className="h-24 w-16 rounded-none sm:h-28 sm:w-[88px]" />
          <div className="space-y-3"><Skeleton className="h-6 w-3/4 rounded-none" /><Skeleton className="h-10 w-full max-w-52 rounded-none" /><Skeleton className="h-3 w-1/2 rounded-none" /></div>
          <Skeleton className="hidden h-4 w-16 rounded-none sm:block" />
          <Skeleton className="hidden h-7 w-16 rounded-none sm:block" />
          <Skeleton className="col-start-2 h-10 w-20 rounded-none sm:col-start-auto" />
        </div>
      ))}
    </div>
  );
}
