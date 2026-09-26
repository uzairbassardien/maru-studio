import { Link } from "react-router-dom";
import type { Product } from "@/data/products";

const ProductCard = ({ product, compact = false }: { product: Product; compact?: boolean }) => (
  <Link to={`/product/${encodeURIComponent(product.id)}`} className="product-card group block min-w-0">
    <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-muted">
      <img
        src={product.images[0] || "/placeholder.svg"}
        alt={product.name}
        className="h-full w-full object-cover"
        loading="lazy"
        width={600}
        height={800}
      />
      {product.images[1] && (
        <img
          src={product.images[1]}
          alt=""
          aria-hidden="true"
          className="product-card-alternate absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
          loading="lazy"
          width={600}
          height={800}
        />
      )}
    </div>
    <h3 className={`break-words font-serif leading-snug tracking-wide ${compact ? "text-base sm:text-lg" : "text-lg md:text-xl"}`}>{product.name}</h3>
    <p className="mt-2 text-xs tracking-wide">R{product.price.toFixed(2)}</p>
  </Link>
);

export default ProductCard;
