import { useParams, Link } from "react-router-dom";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="px-6 md:px-12 py-32 text-center">
        <p className="text-sm tracking-wide">Product not found.</p>
        <Link to="/shop" className="text-xs tracking-[0.25em] uppercase hover-underline mt-4 inline-block">
          Back to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="px-6 md:px-12 py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-6xl mx-auto">
        {/* Image */}
        <div className="animate-fade-in">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full aspect-[3/4] object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center animate-fade-in-delay">
          <h1 className="font-serif text-3xl md:text-4xl tracking-wide mb-3">
            {product.name}
          </h1>
          <p className="text-sm tracking-wide mb-8">${product.price}</p>
          <p className="text-sm leading-relaxed mb-8 max-w-md">
            {product.description}
          </p>

          {/* Size selector */}
          <div className="mb-8">
            <p className="text-xs tracking-[0.2em] uppercase mb-3">Size</p>
            <div className="flex gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 text-xs tracking-wide border transition-colors duration-200 ${
                    selectedSize === size
                      ? "bg-primary text-primary-foreground"
                      : "border-foreground/20 hover:border-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className={`w-full md:max-w-xs py-4 text-xs tracking-[0.25em] uppercase transition-opacity duration-300 ${
              selectedSize
                ? "bg-primary text-primary-foreground hover:opacity-80"
                : "bg-primary/30 text-primary-foreground cursor-not-allowed"
            }`}
          >
            {added ? "Added to Cart" : "Add to Cart"}
          </button>

          {/* Fabric info */}
          <div className="mt-10 text-xs tracking-wide">
            <p className="mb-1">
              <span className="tracking-[0.15em] uppercase text-muted-foreground">Fabric:</span>{" "}
              {product.fabric}
            </p>
            <p>
              <span className="tracking-[0.15em] uppercase text-muted-foreground">Care:</span>{" "}
              {product.care}
            </p>
          </div>

          {/* Collapsible sections */}
          <div className="mt-10 border-t border-foreground/10">
            {["Shipping", "Returns", "Size Guide"].map((section) => (
              <div key={section} className="border-b border-foreground/10">
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between py-4 text-xs tracking-[0.2em] uppercase"
                >
                  {section}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${
                      openSection === section ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openSection === section && (
                  <div className="pb-4 text-xs leading-relaxed text-muted-foreground animate-fade-in">
                    {section === "Shipping" &&
                      "Complimentary shipping on all orders. Delivery within 5–7 business days."}
                    {section === "Returns" &&
                      "We accept returns within 14 days of delivery. Items must be unworn with tags attached."}
                    {section === "Size Guide" &&
                      "XS: 0–2 / S: 4–6 / M: 8–10 / L: 12–14 / XL: 16"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
