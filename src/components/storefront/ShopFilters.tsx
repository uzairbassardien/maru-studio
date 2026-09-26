import { useId } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/data/products";
import type { Category } from "@/hooks/useCategories";

type Props = {
  products: Product[];
  categories: Category[];
  params: URLSearchParams;
  onChange: (values: Record<string, string | null>) => void;
};
const legend = "mb-4 font-sans text-[10px] uppercase tracking-[0.16em]";
const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export default function ShopFilters({ products, categories, params, onChange }: Props) {
  const id = useId();
  const sizes = [...new Set(products.flatMap((product) => product.sizes))].sort((a, b) => {
    const first = sizeOrder.indexOf(a.toUpperCase());
    const second = sizeOrder.indexOf(b.toUpperCase());
    return (first < 0 ? 100 : first) - (second < 0 ? 100 : second) || a.localeCompare(b, undefined, { numeric: true });
  });
  return (
    <div className="space-y-7">
      <fieldset className="border-b border-black/10 pb-5">
        <legend className={legend}>Categories</legend>
        {[{ slug: "", name: "All pieces", id: "" }, ...categories].map((category) => (
          <button key={category.slug} type="button" aria-pressed={(params.get("category") || "") === category.slug} onClick={() => onChange({ category: category.slug || null })} className={`flex min-h-11 w-full items-center justify-between gap-3 text-left text-xs transition-colors hover:text-black ${(params.get("category") || "") === category.slug ? "text-black" : "text-muted-foreground"}`}>
            <span className={(params.get("category") || "") === category.slug ? "underline underline-offset-4" : ""}>{category.name}</span>
            <span aria-hidden="true" className="text-[10px] text-muted-foreground">{category.slug ? products.filter((product) => product.categoryId === category.id).length : products.length}</span>
          </button>
        ))}
      </fieldset>
      <fieldset className="border-b border-black/10 pb-6">
        <legend className={legend}>The edit</legend>
        {[{ value: "", label: "All pieces" }, { value: "new", label: "New arrivals" }, { value: "loved", label: "Most loved" }].map((item) => <label key={item.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-xs"><input type="radio" name={`${id}-collection`} checked={(params.get("collection") || "") === item.value} onChange={() => onChange({ collection: item.value || null })} className="h-3.5 w-3.5 accent-black" />{item.label}</label>)}
      </fieldset>
      <form key={`${params.get("min")}-${params.get("max")}`} onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const min = String(data.get("min") || "");
        const max = String(data.get("max") || "");
        const maximum = form.elements.namedItem("max") as HTMLInputElement;
        if (min && max && Number(min) > Number(max)) {
          maximum.setCustomValidity("Maximum price must be at least the minimum price.");
          maximum.reportValidity();
          return;
        }
        onChange({ min: min || null, max: max || null });
      }} onInput={(event) => { (event.currentTarget.elements.namedItem("max") as HTMLInputElement).setCustomValidity(""); }} className="border-b border-black/10 pb-6">
        <fieldset>
          <legend className={legend}>Price range · ZAR</legend>
          <div className="grid grid-cols-2 gap-3">
            {[{ key: "min", label: "From", placeholder: "0" }, { key: "max", label: "To", placeholder: "Any" }].map((field) => <label key={field.key} className="min-w-0 text-[10px] text-muted-foreground">{field.label}<input name={field.key} aria-label={field.key === "min" ? "Minimum price" : "Maximum price"} type="number" min="0" step="0.01" inputMode="decimal" defaultValue={params.get(field.key) || ""} placeholder={field.placeholder} className="mt-2 min-h-11 w-full min-w-0 border border-black/20 bg-transparent px-2 text-xs text-black" /></label>)}
          </div>
          <button type="submit" className="mt-3 min-h-11 w-full border border-black/20 text-[9px] uppercase tracking-[0.15em] transition-colors hover:bg-black hover:text-white">Apply price</button>
        </fieldset>
      </form>
      {!!sizes.length && <fieldset>
        <legend className={legend}>Size</legend>
        <div className="flex flex-wrap gap-2">{sizes.map((size) => <button key={size} type="button" aria-pressed={params.get("size") === size} onClick={() => onChange({ size: params.get("size") === size ? null : size })} className={`min-h-11 min-w-11 border px-2 text-[10px] transition-colors ${params.get("size") === size ? "border-black bg-black text-white" : "border-black/15 hover:border-black"}`}>{size}</button>)}</div>
        <Link to="/size-guide" className="mt-3 inline-flex min-h-11 items-center text-[10px] text-muted-foreground underline underline-offset-4">Find your fit — size guide</Link>
      </fieldset>}
    </div>
  );
}
