import { Link } from "react-router-dom";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden mb-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full aspect-[3/4] object-cover transition-opacity duration-500 group-hover:opacity-90"
          loading="lazy"
        />
      </div>
      <h3 className="font-serif text-lg tracking-wide">{product.name}</h3>
      <p className="text-xs tracking-wide mt-1">${product.price}</p>
    </Link>
  );
};

export default ProductCard;
