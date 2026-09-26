import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";
import { createProductImageUrlMap } from "@/lib/productImages";

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("id");
  if (error) throw error;
  const rows = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description,
    fabric: row.fabric,
    care: row.care,
    images: row.images,
    sizes: row.sizes,
    category: row.category as Product["category"],
    categoryId: row.category_id,
    isFeatured: row.is_featured === true,
    isBestseller: row.is_bestseller === true,
  }));
  const paths = Array.from(new Set(rows.flatMap((r) => r.images)));
  const urls = await createProductImageUrlMap(paths);
  return rows.map((r) => ({
    ...r,
    images: r.images.map((p) => urls.get(p) ?? "/placeholder.svg"),
  }));
}

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: fetchProducts, staleTime: 1000 * 60 * 30 });
