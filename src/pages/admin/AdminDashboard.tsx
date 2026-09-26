import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Edit3, ImageOff, Plus, Search, Trash2 } from "lucide-react";
import { ProductListSkeleton } from "@/components/storefront/ProductSkeletons";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminProducts, adminProductsQueryKey, type AdminProduct } from "@/hooks/useAdminProducts";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { removeProductImages } from "@/lib/productImages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatCurrency = (price: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(price);

const AdminDashboard = () => {
  const { data: products = [], isLoading, error } = useAdminProducts();
  const { data: categories = [], isError: categoriesError } = useCategories(true);
  const [searchParams] = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") === "unassigned" ? "unassigned" : "all",
  );
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "draft">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.id.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        status === "all" ||
        (status === "active" && product.is_active) ||
        (status === "draft" && !product.is_active);
      const assigned = categories.some((category) => category.id === product.category_id && category.is_active);
      const matchesCategory = categoryFilter === "all" || (categoryFilter === "unassigned" ? !assigned : product.category_id === categoryFilter);
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [products, query, status, categories, categoryFilter]);

  const assignCategory = async (productId: string, categoryId: string) => {
    if (!categoryId) return;
    setSavingCategoryId(productId);
    try {
      const { error: updateError } = await supabase.from("products").update({ category_id: categoryId }).eq("id", productId).select("id").single();
      if (updateError) throw updateError;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminProductsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      toast.success("Category updated");
    } catch {
      toast.error("Category could not be saved. Please try again.");
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteTarget.id);

    if (deleteError) {
      toast.error("Product could not be deleted", { description: deleteError.message });
      setIsDeleting(false);
      return;
    }

    try {
      await removeProductImages(deleteTarget.images);
      toast.success("Product deleted");
    } catch (imageError) {
      toast.warning("Product deleted, but some image files could not be removed", {
        description: imageError instanceof Error ? imageError.message : undefined,
      });
    }

    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: adminProductsQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);
    setDeleteTarget(null);
    setIsDeleting(false);
  };

  const activeCount = products.filter((product) => product.is_active).length;
  const draftCount = products.length - activeCount;
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-black/45">Catalogue</p>
          <h1 className="mt-2 font-serif text-5xl lg:text-6xl">Products</h1>
          <p className="mt-3 text-sm text-black/50">Manage every piece in the Maru collection.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center gap-3 bg-black px-6 py-4 text-xs uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-75"
        >
          <Plus size={16} /> Add product
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-3 border border-black/10 bg-white">
        {[
          ["Total", products.length],
          ["Active", activeCount],
          ["Draft", draftCount],
        ].map(([label, value], index) => (
          <div key={label} className={`p-5 sm:p-7 ${index > 0 ? "border-l border-black/10" : ""}`}>
            <p className="text-[9px] uppercase tracking-[0.22em] text-black/45">{label}</p>
            <p className="mt-2 font-serif text-3xl sm:text-4xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-b border-black/15 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            className="w-full border-0 border-b border-black/25 bg-transparent py-3 pl-7 pr-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "draft"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] ${
                status === option ? "bg-black text-white" : "bg-white text-black/55 hover:text-black"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="my-5 flex flex-wrap items-center gap-3 text-xs">
        <label htmlFor="admin-category-filter">Product category</label>
        <select id="admin-category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-11 border border-black/20 bg-white px-3">
          <option value="all">All categories</option>
          <option value="unassigned">Needs a category</option>
          {categories.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        {categoriesError && <p role="alert">Categories could not be loaded. Refresh to try again.</p>}
      </div>

      {isLoading && <ProductListSkeleton />}

      {error && (
        <div className="my-10 border border-black bg-white p-6 text-sm">
          <p className="font-medium">Products could not be loaded.</p>
          <p className="mt-2 text-black/55">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-serif text-3xl">No products found</p>
          <p className="mt-3 text-sm text-black/45">
            {products.length ? "Try a different search or status filter." : "Add the first piece to the collection."}
          </p>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="divide-y divide-black/10">
          {filteredProducts.map((product) => (
            <article key={product.id} className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4 py-5 sm:grid-cols-[88px_minmax(0,2fr)_1fr_1fr_auto] sm:gap-6">
              <div className="flex h-24 w-16 items-center justify-center overflow-hidden bg-black/5 sm:h-28 sm:w-[88px]">
                {product.imageUrls[0] ? (
                  <img src={product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff size={20} className="text-black/25" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-serif text-xl sm:text-2xl">{product.name}</h2>
                <select aria-label={`Category for ${product.name}`} value={product.category_id ?? ""} disabled={Boolean(savingCategoryId) || categoriesError} onChange={(event) => void assignCategory(product.id, event.target.value)} className="mt-2 min-h-11 w-full max-w-52 border border-black/20 bg-white px-2 text-xs disabled:opacity-50">
                  <option value="" disabled>Assign a category</option>
                  {categories.map((item) => <option key={item.id} value={item.id} disabled={!item.is_active}>{item.name}{item.is_active ? "" : " (Inactive)"}</option>)}
                </select>
                {(product.is_featured || product.is_bestseller) && <p className="mt-2 text-[9px] uppercase tracking-wide">{product.is_bestseller ? "Bestseller" : "Featured"} · Most Loved</p>}
                <p className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-black/40">
                  {product.category_id ? categoryNames.get(product.category_id) ?? "Uncategorized" : "Uncategorized"} · {product.id}
                </p>
                <p className="mt-2 text-sm sm:hidden">{formatCurrency(product.price)}</p>
              </div>
              <p className="hidden text-sm sm:block">{formatCurrency(product.price)}</p>
              <div className="hidden sm:block">
                <span className={`inline-block px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] ${product.is_active ? "bg-black text-white" : "border border-black/20 text-black/50"}`}>
                  {product.is_active ? "Active" : "Draft"}
                </span>
              </div>
              <div className="col-start-2 flex items-center gap-1 sm:col-start-auto">
                <Link
                  to={`/admin/products/${encodeURIComponent(product.id)}/edit`}
                  className="p-3 transition-colors hover:bg-black hover:text-white"
                  aria-label={`Edit ${product.name}`}
                >
                  <Edit3 size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(product)}
                  className="p-3 transition-colors hover:bg-black hover:text-white"
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-3xl font-normal">Delete this product?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed text-black/55">
              “{deleteTarget?.name}” and its uploaded images will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting} className="rounded-none border-black">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className="rounded-none bg-black text-white"
            >
              {isDeleting ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
