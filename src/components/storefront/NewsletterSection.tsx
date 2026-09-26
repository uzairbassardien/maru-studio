import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // The previous footer only toggled local state. Connect the approved mailing
    // provider here before claiming success; do not retain unsent email addresses.
    setMessage("The Maru List is coming soon. Sign-ups are not open yet.");
    setEmail("");
  }
  return (
    <section aria-label="Newsletter" className="bg-black text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 md:py-20 lg:px-12 lg:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-24">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <span aria-hidden="true" className="h-px w-8 bg-white/50" />
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/65">Letters from Maru</p>
            </div>
            <h2 className="font-serif text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">Join the <span className="italic">Maru List.</span></h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">New collections, private releases and stories from Maru. A little closer to our world.</p>
          </div>
          <div className="min-w-0 md:border-l md:border-white/20 md:pl-10 lg:pl-14">
            <p className="mb-5 font-serif text-2xl sm:text-3xl">A note, just for you.</p>
            <form onSubmit={handleSubmit} className="flex min-w-0 items-stretch border border-white/40 transition-colors focus-within:border-white">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input id="newsletter-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" aria-describedby="newsletter-status" className="min-w-0 flex-1 rounded-none bg-transparent px-4 py-4 text-base text-white placeholder:text-white/55 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-4px] focus-visible:outline-white sm:text-sm" />
              <button type="submit" className="group flex min-h-14 shrink-0 items-center gap-3 bg-white px-5 text-[10px] uppercase tracking-[0.2em] text-black transition-colors duration-300 hover:bg-neutral-200 focus-visible:outline-offset-[-4px] sm:px-6">Join<ArrowRight aria-hidden="true" size={15} strokeWidth={1} className="transition-transform duration-300 motion-safe:group-hover:translate-x-1" /></button>
            </form>
            <p id="newsletter-status" role="status" className="mt-4 min-h-10 text-xs leading-6 text-white/65">{message || "Sign-ups opening soon. Something lovely is on its way."}</p>
          </div>
        </div>
        <div aria-hidden="true" className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/20 pt-6 text-[8px] uppercase tracking-[0.2em] text-white/55 sm:gap-x-8 md:mt-14">
          <span>New collections</span><span className="h-0.5 w-0.5 bg-white/40" /><span>Private releases</span><span className="h-0.5 w-0.5 bg-white/40" /><span>Stories from Maru</span>
        </div>
      </div>
    </section>
  );
}
