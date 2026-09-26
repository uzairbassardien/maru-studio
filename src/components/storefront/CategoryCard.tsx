import { Link } from "react-router-dom";
import type { Category } from "@/hooks/useCategories";
import brandImage from "@/assets/about.png";
import { cn } from "@/lib/utils";

export default function CategoryCard({ category, image, className }: { category: Category; image?: string; className?: string }) {
  return (
    <Link to={`/shop?category=${encodeURIComponent(category.slug)}`} className={cn("group block min-w-0", className)}>
      <div className="mb-4 aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={image || brandImage}
          alt={image ? `${category.name} from the Maru collection` : "Maru by Maru editorial"}
          loading="lazy"
          width={600}
          height={800}
          className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.025]"
        />
      </div>
      <h3 className="break-words font-serif text-2xl md:text-3xl">{category.name}</h3>
      <span className="mt-2 inline-block py-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">Explore →</span>
    </Link>
  );
}
