import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;

async function fetchCategories(includeInactive: boolean) {
  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export const categoriesQueryKey = ["categories"] as const;

export const useCategories = (includeInactive = false) =>
  useQuery({
    queryKey: [...categoriesQueryKey, includeInactive ? "admin" : "public"],
    queryFn: () => fetchCategories(includeInactive),
    staleTime: 1000 * 60 * 30,
  });
