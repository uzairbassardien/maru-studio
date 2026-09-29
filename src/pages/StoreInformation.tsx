import { Link } from "react-router-dom";

// Reuses existing ProductDetail copy. Business owners should review these pages
// before launch; never add unconfirmed payment, delivery or legal promises here.
const pages = {
  shipping: {
    title: "Shipping & Delivery",
    intro: "From the Maru collection to your wardrobe.",
    sections: [
      ["Delivery", "Complimentary shipping on all orders. Delivery within 5–7 business days."],
      ["Your address", "Please provide a complete delivery address and contact number at checkout. Delivery arrangements will be confirmed with you after your order is placed."],
    ],
  },
  returns: {
    title: "Returns & Exchanges",
    intro: "Taking care of your purchase.",
    sections: [
      ["Returns", "We accept returns within 14 days of delivery. Items must be unworn with tags attached."],
      ["Arranging a return", "Keep your order reference and original packaging. Return instructions and exchange arrangements will be confirmed by the team; a detailed process will be published here soon."],
    ],
  },
  "size-guide": {
    title: "Size Guide",
    intro: "Find the silhouette that feels like you.",
    sections: [
      ["Available sizes", "Select a piece to see its available sizes. Fabric and care details appear on each product page."],
      ["Fit guidance", "Garment measurements and a confirmed regional size conversion chart will be added here soon. Until then, fit can be confirmed with your order before payment arrangements are made."],
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    intro: "A few details to help you along the way.",
    sections: [
      ["How do I place an order?", "Choose your pieces and sizes, add them to your cart, then select Place Your Order. Enter your contact and delivery details and submit. Your order reference will appear on the confirmation screen."],
      ["Do I need an account?", "You can place an order as a guest. No customer account is required."],
      ["When do I pay?", "Payment and delivery arrangements will be confirmed with you after your order is placed. No payment is collected by the current checkout."],
      ["Will my cart be saved?", "Your current cart lasts while you browse. Refreshing or closing the page clears it."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "Your information deserves thoughtful care.",
    sections: [
      ["Order information", "Checkout asks for your name, email, phone number, delivery address and any order notes. These details are saved with your order so the Maru team can manage it."],
      ["Full policy", "Our full privacy policy and privacy contact details are being prepared. They will be published here once confirmed."],
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "Shopping with Maru by Maru.",
    sections: [
      ["Placing an order", "Prices are displayed in South African rand. The current checkout records your order and provides an order reference. Payment and delivery arrangements are confirmed afterwards."],
      ["Full terms", "Our complete trading terms are being prepared and will be published here once confirmed."],
    ],
  },
};

export type InformationPage = keyof typeof pages;

export default function StoreInformation({ page }: { page: InformationPage }) {
  const content = pages[page];
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Maru by Maru</p>
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">{content.title}</h1>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{content.intro}</p>
      <div className="mt-12 space-y-8 border-t border-black/10 pt-10">
        {content.sections.map(([title, text]) => <section key={title}>
          <h2 className="font-serif text-2xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
        </section>)}
      </div>
      <div className="mt-12 flex flex-wrap gap-6 text-[10px] uppercase tracking-[0.2em]">
        <Link to="/shop" className="py-3 hover-underline">Explore the collection →</Link>
        {page !== "faq" && <Link to="/faq" className="py-3 hover-underline">Common questions →</Link>}
      </div>
    </div>
  );
}
