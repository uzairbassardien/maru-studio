import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Instagram, Mail, MessageCircle, Music2 } from "lucide-react";

// Replace these display-only placeholders with approved business details.
const socials = [
  { name: "WhatsApp", detail: "+27 XX XXX XXXX", description: "A little guidance, a conversation away.", icon: MessageCircle },
  { name: "Instagram", detail: "@marubymaru", description: "The collection, the details, the everyday.", icon: Instagram },
  { name: "TikTok", detail: "@marubymaru", description: "A glimpse into the world of Maru.", icon: Music2 },
  { name: "Email", detail: "hello@marubymaru.example", description: "For questions, ideas and everything between.", icon: Mail },
];
const fieldClass = "mt-3 min-h-12 w-full min-w-0 rounded-none border border-black/20 bg-white px-4 py-3 text-base normal-case tracking-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm";
const labelClass = "block text-[10px] uppercase tracking-[0.16em]";

const quickAnswers = [
  {
    title: "Shipping & Delivery",
    to: "/shipping",
    text: "Complimentary shipping on all orders, delivered within 5–7 business days.",
  },
  {
    title: "Returns & Exchanges",
    to: "/returns",
    text: "Fourteen days to return unworn pieces with their tags attached.",
  },
  {
    title: "Size Guide",
    to: "/size-guide",
    text: "Guidance on sizes, fit and fabric for every silhouette.",
  },
  {
    title: "Common Questions",
    to: "/faq",
    text: "Ordering, payment and cart answers, all in one place.",
  },
];

export default function Contact() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageField = event.currentTarget.elements.namedItem("message") as HTMLTextAreaElement;
    if (!message.trim()) {
      messageField.setCustomValidity("Please enter a message.");
      messageField.reportValidity();
      return;
    }
    // Presentation only: retain the draft and never claim delivery without a sender.
    setStatus("This form is a preview. Your message has not been sent. Direct contact details will be available soon.");
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 md:py-20 lg:px-12">
      <header className="mb-10 border-b border-black/10 pb-10 md:mb-14 md:pb-14">
        <p className="mb-5 text-[9px] uppercase tracking-[0.26em] text-muted-foreground">Maru by Maru / Contact &amp; care</p>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end md:gap-12">
          <h1 className="font-serif text-[clamp(2.75rem,5.5vw,5rem)] leading-[1.05]">Let’s start<br /><span className="italic">a conversation.</span></h1>
          <p className="max-w-xs text-sm leading-7 text-muted-foreground">A question about a piece, a little help with sizing, or simply a hello. There’s a place for it here.</p>
        </div>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 xl:gap-20">
        <section aria-labelledby="contact-form-heading" className="min-w-0 lg:col-start-2 lg:row-start-1">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div><p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">A note to Maru</p><h2 id="contact-form-heading" className="font-serif text-3xl sm:text-4xl">How can we help?</h2></div>
            <span className="mt-1 shrink-0 border border-black/15 px-3 py-2 text-[8px] uppercase tracking-[0.15em] text-muted-foreground">Enquiries</span>
          </div>
          <p id="contact-form-notice" className="mb-7 text-xs leading-6 text-muted-foreground">Our contact form is being prepared. You can explore it below, but messages aren’t sent yet. Fields marked * are required.</p>
          <form onSubmit={handleSubmit} aria-labelledby="contact-form-heading" aria-describedby="contact-form-notice" onInput={() => setStatus("")} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className={labelClass} htmlFor="contact-name">Your name *<input id="contact-name" name="name" autoComplete="name" required pattern=".*\S.*" title="Please enter your name." maxLength={100} placeholder="Full name" className={fieldClass} /></label>
              <label className={labelClass} htmlFor="contact-email">Email address *<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={320} placeholder="you@example.com" className={fieldClass} /></label>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="contact-topic">What’s on your mind? *</label><select id="contact-topic" name="topic" required defaultValue="" className={fieldClass}><option value="" disabled>Select a topic</option><option value="product">A product or sizing question</option><option value="order">An existing order</option><option value="delivery">Delivery or returns</option><option value="collaboration">Collaborations</option><option value="other">Something else</option></select></div>
              <label className={labelClass} htmlFor="contact-order">Order reference <span className="normal-case tracking-normal text-muted-foreground">(optional)</span><input id="contact-order" name="order_reference" maxLength={80} placeholder="e.g. MBM-…" className={fieldClass} /></label>
            </div>
            <div>
              <label className={labelClass} htmlFor="contact-message">Your message *</label>
              <textarea id="contact-message" name="message" required maxLength={2000} rows={6} value={message} onChange={(event) => { event.target.setCustomValidity(""); setMessage(event.target.value); }} placeholder="Tell us a little more…" aria-describedby="contact-message-count" className={`${fieldClass} min-h-40 resize-y leading-7`} />
              <p id="contact-message-count" className="mt-2 text-right text-[10px] tracking-wide text-muted-foreground">{message.length} / 2,000</p>
            </div>
            <div className="flex flex-col gap-5 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-64 text-xs leading-6 text-muted-foreground">For an existing order, include your reference so we can find the details.</p>
              <button type="submit" className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-6 bg-black px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-black/80">Send message<ArrowRight aria-hidden="true" size={16} strokeWidth={1.25} className="transition-transform duration-300 motion-safe:group-hover:translate-x-1" /></button>
            </div>
            <p role="status" aria-live="polite" className="text-sm leading-6 text-muted-foreground">{status}</p>
          </form>
        </section>

        <aside aria-labelledby="contact-socials-heading" className="min-w-0 bg-black px-6 py-8 text-white sm:p-9 lg:col-start-1 lg:row-start-1 lg:p-10">
          <p className="mb-5 text-[9px] uppercase tracking-[0.25em] text-white/60">The conversation continues</p>
          <h2 id="contact-socials-heading" className="font-serif text-4xl leading-tight">A little closer<br /><span className="italic">to Maru.</span></h2>
          <p className="mb-8 mt-5 max-w-sm text-xs leading-6 text-white/65">Find us in the everyday. Our social and contact details will be shared here soon.</p>
          <ul className="divide-y divide-white/20 border-y border-white/20">
            {socials.map(({ name, detail, description, icon: Icon }) => (
              <li key={name} className="flex gap-4 py-6">
                <Icon aria-hidden="true" size={20} strokeWidth={1.1} className="mt-1 shrink-0 text-white/80" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-serif text-2xl">{name}</h3><span className="text-[8px] uppercase tracking-[0.12em] text-white/55">Placeholder</span></div>
                  <p className="mt-2 break-words text-xs tracking-wide text-white/85">{detail}</p>
                  <p className="mt-2 text-[11px] leading-6 text-white/60">{description}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-7 font-serif text-xl italic text-white/75">Thoughtful pieces. Personal connections.</p>
        </aside>
      </div>

      <section aria-labelledby="quick-answers-heading" className="mt-14 border-t border-black/10 pt-10 md:mt-20 md:pt-14">
        <p className="mb-3 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">A little guidance</p>
        <h2 id="quick-answers-heading" className="mb-6 font-serif text-3xl sm:text-4xl">While you’re here.</h2>
        <nav aria-label="Customer care pages" className="grid gap-x-10 md:grid-cols-2 lg:gap-x-16">
          {quickAnswers.map(({ title, to, text }, index) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-5 border-b border-black/10 py-5 transition-opacity hover:opacity-70"
            >
              <span aria-hidden="true" className="text-[9px] tracking-wider text-black/35">0{index + 1}</span>
              <span className="min-w-0">
                <span className="block font-serif text-xl leading-snug">{title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{text}</span>
              </span>
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1} className="ml-auto shrink-0 text-black/35 transition-opacity group-hover:opacity-100 md:opacity-40" />
            </Link>
          ))}
        </nav>
      </section>

      <div className="mt-12 flex flex-wrap gap-6 text-[10px] uppercase tracking-[0.2em]">
        <Link to="/shop" className="py-3 hover-underline">Explore the collection →</Link>
        <Link to="/faq" className="py-3 hover-underline">Common questions →</Link>
      </div>
    </div>
  );
}
