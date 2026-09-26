import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { createProductImageUrlMap } from "@/lib/productImages";

export type AdminOrder = Tables<"orders">;
export type AdminOrderItem = Tables<"order_items"> & { imageUrl: string };

export const adminOrdersQueryKey = ["admin", "orders"] as const;

export const useAdminOrders = () =>
  useQuery({
    queryKey: adminOrdersQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        shipping_amount: Number(order.shipping_amount),
        total: Number(order.total),
      }));
    },
    staleTime: 1000 * 30,
  });

export const useAdminOrder = (id: string | undefined) =>
  useQuery({
    queryKey: [...adminOrdersQueryKey, id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error("Order ID is required");

      const [orderResult, itemsResult] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).single(),
        supabase
          .from("order_items")
          .select("*")
          .eq("order_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (orderResult.error) throw orderResult.error;
      if (itemsResult.error) throw itemsResult.error;

      const paths = (itemsResult.data ?? [])
        .map((item) => item.product_image_path)
        .filter(Boolean);
      const urls = await createProductImageUrlMap(paths);

      return {
        order: {
          ...orderResult.data,
          subtotal: Number(orderResult.data.subtotal),
          shipping_amount: Number(orderResult.data.shipping_amount),
          total: Number(orderResult.data.total),
        },
        items: (itemsResult.data ?? []).map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total),
          imageUrl: urls.get(item.product_image_path) ?? "",
        })),
      };
    },
  });

