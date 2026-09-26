import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { createProductImageUrlMap } from "@/lib/productImages";

export type AdminProduct = Tables<"products"> & {
  imageUrls: string[];
};

async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const paths = (data ?? []).flatMap((product) => product.images);
  const urls = await createProductImageUrlMap(paths);

  return (data ?? []).map((product) => ({
    ...product,
    price: Number(product.price),
    imageUrls: product.images.map((path) => urls.get(path) ?? ""),
  }));
}

export const adminProductsQueryKey = ["admin", "products"] as const;

export const useAdminProducts = () =>
  useQuery({
    queryKey: adminProductsQueryKey,
    queryFn: fetchAdminProducts,
    staleTime: 1000 * 60 * 5,
  });

