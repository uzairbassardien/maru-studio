import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

const Shop = () => {
  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <h1 className="font-serif text-4xl md:text-5xl tracking-wide text-center mb-4 animate-fade-in">
        Shop
      </h1>
      <p className="text-xs tracking-[0.15em] text-center text-muted-foreground mb-16 animate-fade-in-delay">
        All pieces
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in-delay-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Shop;
