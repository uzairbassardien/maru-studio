import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";

const Cart = () => {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="px-6 md:px-12 py-32 text-center">
        <h1 className="font-serif text-3xl md:text-4xl tracking-wide mb-6 animate-fade-in">
          Your Cart is Empty
        </h1>
        <Link
          to="/shop"
          className="inline-block bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase px-10 py-4 transition-opacity duration-300 hover:opacity-80 animate-fade-in-delay"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-16 md:py-24 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl md:text-4xl tracking-wide mb-12 animate-fade-in">
        Cart
      </h1>

      <div className="animate-fade-in-delay">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-foreground/10 text-xs tracking-[0.2em] uppercase text-muted-foreground">
          <span className="col-span-6">Item</span>
          <span className="col-span-2 text-center">Size</span>
          <span className="col-span-2 text-center">Quantity</span>
          <span className="col-span-2 text-right">Price</span>
        </div>

        {/* Items */}
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.size}`}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b border-foreground/10 items-center"
          >
            {/* Product */}
            <div className="md:col-span-6 flex gap-4 items-center">
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-20 h-28 object-cover"
              />
              <div>
                <h3 className="font-serif text-lg">{item.product.name}</h3>
                <span className="md:hidden text-xs tracking-wide">
                  Size: {item.size}
                </span>
              </div>
            </div>

            {/* Size */}
            <div className="hidden md:block md:col-span-2 text-center text-sm">
              {item.size}
            </div>

            {/* Quantity */}
            <div className="md:col-span-2 flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.size, item.quantity - 1)
                }
                className="p-1 transition-opacity hover:opacity-60"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm w-6 text-center">{item.quantity}</span>
              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.size, item.quantity + 1)
                }
                className="p-1 transition-opacity hover:opacity-60"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => removeItem(item.product.id, item.size)}
                className="p-1 ml-2 transition-opacity hover:opacity-60"
                aria-label="Remove item"
              >
                <X size={14} />
              </button>
            </div>

            {/* Price */}
            <div className="md:col-span-2 text-right text-sm">
              ${item.product.price * item.quantity}
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="flex justify-between items-center pt-8">
          <span className="text-xs tracking-[0.2em] uppercase">Total</span>
          <span className="font-serif text-2xl">${totalPrice}</span>
        </div>

        {/* Checkout */}
        <div className="mt-10 flex flex-col md:flex-row gap-4 md:justify-end">
          <Link
            to="/shop"
            className="text-xs tracking-[0.25em] uppercase hover-underline text-center py-4"
          >
            Continue Shopping
          </Link>
          <a
            href={`https://wa.me/1234567890?text=${encodeURIComponent(
              `Hello Maru by Maru! I'd like to place an order:\n\n${items
                .map(
                  (item) =>
                    `• ${item.product.name} (Size: ${item.size}) x${item.quantity} — $${item.product.price * item.quantity}`
                )
                .join("\n")}\n\nTotal: $${totalPrice}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase px-12 py-4 transition-opacity duration-300 hover:opacity-80 text-center"
          >
            Order via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default Cart;
