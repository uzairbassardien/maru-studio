export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  fabric: string;
  care: string;
  images: string[];
  sizes: string[];
  category: "new" | "collection";
  categoryId: string | null;
  isFeatured: boolean;
  isBestseller: boolean;
}

// Products are stored in the Supabase "products" table — see src/hooks/useProducts.ts.
