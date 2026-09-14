import { Link } from "react-router-dom";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const isBestSeller =
    product.id === "elan-cropped-trench-jacket-beige" ||
    product.id === "elan-cropped-trench-jacket-black";

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden mb-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full aspect-[3/4] object-cover transition-all duration-500 group-hover:opacity-90"
          loading="lazy"
        />

        {isBestSeller && (
          <span className="absolute right-3 top-3 z-10 rounded-full border border-[#b89b68] bg-[#f3ead9]/95 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-[#3a2e20] shadow-sm transition-transform duration-300 group-hover:scale-105">
            Loved by Many
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg tracking-wide">{product.name}</h3>
      <p className="text-xs tracking-wide mt-1">R{product.price}</p>
    </Link>
  );
};

export default ProductCard;
