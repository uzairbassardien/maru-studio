import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero.png";

export default function Hero() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      if (preference.matches) video.current?.pause();
      else void video.current?.play().catch(() => undefined);
    };
    syncMotion();
    preference.addEventListener("change", syncMotion);
    return () => preference.removeEventListener("change", syncMotion);
  }, []);

  return (
    <section className="relative flex min-h-[560px] h-[calc(100svh-4rem)] max-h-[1050px] items-center justify-center overflow-hidden bg-black">
      <video ref={video} muted loop playsInline poster={heroImage} preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true">
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative px-5 py-16 text-center text-white sm:px-8">
        <h1 className="mx-auto max-w-5xl font-serif text-[clamp(2.5rem,5.5vw,5.5rem)] leading-[1.06] tracking-wide animate-fade-in">Timeless Dresses.<br className="sm:hidden" /> Pure Expression.</h1>
        <p className="mx-auto mb-8 mt-6 max-w-sm text-xs leading-relaxed tracking-[0.12em] animate-fade-in-delay sm:max-w-none sm:text-sm">Designed for simplicity. Crafted for presence.</p>
        <div className="flex flex-col items-center gap-3 animate-fade-in-delay-2">
          <Link to="/shop" className="group relative isolate overflow-hidden border border-white bg-transparent px-7 py-4 text-[10px] uppercase tracking-[0.22em] text-white transition-colors duration-500 ease-out hover:text-black focus-visible:text-black">
            <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
            Shop the Collection
          </Link>
          <Link to="/shop?collection=new" className="px-4 py-3 text-[9px] uppercase tracking-[0.22em] underline decoration-white/50 underline-offset-8 transition-opacity hover:opacity-70">View New Arrivals</Link>
        </div>
      </div>
    </section>
  );
}
