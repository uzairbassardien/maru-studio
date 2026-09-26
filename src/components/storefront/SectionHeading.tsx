export default function SectionHeading({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <div className="mb-8 text-center md:mb-12">
      {eyebrow && <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>}
      <h2 className="font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed tracking-wide text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
