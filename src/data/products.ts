import product1 from "@/assets/product1.png";
import product2 from "@/assets/product2.png";
import product3 from "@/assets/product3.png";
import product4 from "@/assets/product4.png";

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
}

export const products: Product[] = [
  {
    id: "asymmetric-midi",
    name: "The Asymmetric Midi",
    price: 420,
    description: "A refined one-shoulder silhouette in flowing fabric. Designed to move with quiet confidence.",
    fabric: "100% Silk Crepe",
    care: "Dry clean only. Store on padded hanger.",
    images: [product1],
    sizes: ["XS", "S", "M", "L", "XL"],
    category: "new",
  },
  {
    id: "sculptural-sheath",
    name: "The Sculptural Sheath",
    price: 380,
    description: "A strapless column dress with structured bodice. Pure form, timeless presence.",
    fabric: "Stretch Wool Blend",
    care: "Dry clean only.",
    images: [product2],
    sizes: ["XS", "S", "M", "L"],
    category: "collection",
  },
  {
    id: "draped-column",
    name: "The Draped Column",
    price: 460,
    description: "Cascading drape in lustrous fabric. An ode to effortless elegance.",
    fabric: "100% Mulberry Silk",
    care: "Dry clean recommended. Iron on low.",
    images: [product3],
    sizes: ["XS", "S", "M", "L", "XL"],
    category: "new",
  },
  {
    id: "minimal-slip",
    name: "The Minimal Slip",
    price: 340,
    description: "A delicate V-neck slip with clean lines. Simplicity at its most refined.",
    fabric: "Silk Charmeuse",
    care: "Hand wash cold. Lay flat to dry.",
    images: [product4],
    sizes: ["S", "M", "L"],
    category: "collection",
  },
];
