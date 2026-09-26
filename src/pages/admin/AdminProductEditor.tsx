import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminProducts, adminProductsQueryKey } from "@/hooks/useAdminProducts";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { removeProductImages, uploadProductImages } from "@/lib/productImages";
import { Skeleton } from "@/components/ui/skeleton";

interface ManagedImage {
  key: string;
  preview: string;
  path?: string;
  file?: File;
}

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}

const Field = ({ label, htmlFor, hint, children }: FieldProps) => (
  <div>
    <div className="mb-2 flex items-end justify-between gap-4">
      <label htmlFor={htmlFor} className="text-[10px] uppercase tracking-[0.2em]">
        {label}
      </label>
      {hint && <span className="text-[10px] text-black/40">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputClass =
  "w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-black/25 focus:border-black";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const AdminProductEditor = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products = [], isLoading, error: productsError } = useAdminProducts();
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useCategories(true);
  const product = products.find((item) => item.id === id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedId = useRef<string | null>(null);
  const imagesRef = useRef<ManagedImage[]>([]);

  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [idWasEdited, setIdWasEdited] = useState(false);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [fabric, setFabric] = useState("");
  const [care, setCare] = useState("");
  const [sizes, setSizes] = useState("XS, S, M, L, XL");
  const [category, setCategory] = useState<"new" | "collection">("collection");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((image) => {
        if (image.file) URL.revokeObjectURL(image.preview);
      });
    },
    [],
  );

  useEffect(() => {
    if (!product || initializedId.current === product.id) return;
    initializedId.current = product.id;
    setName(product.name);
    setProductId(product.id);
    setPrice(String(product.price));
    setDescription(product.description);
    setFabric(product.fabric);
    setCare(product.care);
    setSizes(product.sizes.join(", "));
    setCategory(product.category as "new" | "collection");
    setProductCategoryId(product.category_id ?? "");
    setIsFeatured(product.is_featured === true);
    setIsBestseller(product.is_bestseller === true);
    setSortOrder(String(product.sort_order));
    setIsActive(product.is_active);
    setImages(
      product.images.map((path, index) => ({
        key: path,
        path,
        preview: product.imageUrls[index] ?? "",
      })),
    );
  }, [product]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEditing && !idWasEdited) setProductId(slugify(value));
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024,
    );
    if (invalidFile) {
      setFormError("Images must be image files no larger than 10 MB each.");
      return;
    }
    if (images.length + files.length > 10) {
      setFormError("A product can have up to 10 images.");
      return;
    }

    setFormError("");
    setImages((current) => [
      ...current,
      ...files.map((file) => ({
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const image = current[index];
      if (image?.file) URL.revokeObjectURL(image.preview);
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= images.length) return;
    setImages((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  };

  const validate = () => {
    const parsedPrice = Number(price);
    const parsedSizes = sizes
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean);

    if (!name.trim()) return "Enter a product name.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId)) {
      return "The product ID must use lowercase letters, numbers, and single hyphens.";
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return "Enter a valid price.";
    if (!parsedSizes.length) return "Add at least one size.";
    if (!categories.some((item) => item.id === productCategoryId && item.is_active)) return "Choose an active product category.";
    if (!images.length) return "Add at least one product image.";
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFormError("");
    setIsSaving(true);
    const newImages = images.filter((image): image is ManagedImage & { file: File } => Boolean(image.file));
    let uploadedPaths: string[] = [];
    let databaseSaved = false;

    try {
      uploadedPaths = await uploadProductImages(
        productId,
        newImages.map((image) => image.file),
      );

      const uploadedByKey = new Map(
        newImages.map((image, index) => [image.key, uploadedPaths[index]]),
      );
      const imagePaths = images.map((image) => image.path ?? uploadedByKey.get(image.key) ?? "");

      const payload: TablesInsert<"products"> = {
        id: productId,
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        fabric: fabric.trim(),
        care: care.trim(),
        images: imagePaths,
        sizes: sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean),
        category,
        category_id: productCategoryId,
        is_featured: isFeatured,
        is_bestseller: isBestseller,
        sort_order: Number.parseInt(sortOrder, 10) || 0,
        is_active: isActive,
      };

      const result = isEditing
        ? await supabase.from("products").update(payload).eq("id", product!.id).select("id").single()
        : await supabase.from("products").insert(payload);

      if (result.error) throw result.error;
      databaseSaved = true;

      if (isEditing && product) {
        const removedPaths = product.images.filter((path) => !imagePaths.includes(path));
        if (removedPaths.length) {
          try {
            await removeProductImages(removedPaths);
          } catch (removeError) {
            toast.warning("Product saved, but removed image files need manual cleanup", {
              description: removeError instanceof Error ? removeError.message : undefined,
            });
          }
        }
      }

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: adminProductsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      toast.success(isEditing ? "Product updated" : "Product created");
      navigate("/admin/products", { replace: true });
    } catch (caught) {
      if (!databaseSaved && uploadedPaths.length) {
        await removeProductImages(uploadedPaths).catch(() => undefined);
      }
      const message = caught instanceof Error ? caught.message : "The product could not be saved.";
      setFormError(message);
      toast.error("Product could not be saved", { description: message });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div role="status" aria-label="Loading product editor" className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <span className="sr-only">Loading product…</span>
        <div aria-hidden="true">
          <Skeleton className="mb-10 h-14 w-2/3 max-w-sm rounded-none" />
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-7">{Array.from({ length: 5 }, (_, index) => <div key={index}><Skeleton className="mb-3 h-3 w-24 rounded-none" /><Skeleton className={`${index === 2 ? "h-32" : "h-12"} w-full rounded-none`} /></div>)}</div>
            <div><Skeleton className="mb-5 h-5 w-32 rounded-none" /><Skeleton className="aspect-[3/4] w-full rounded-none" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing && (productsError || !product)) {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="font-serif text-4xl">Product not found</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-black/50">
          {productsError?.message ?? "This product may have been removed."}
        </p>
        <Link to="/admin/products" className="mt-8 inline-block border-b border-black pb-1 text-xs uppercase tracking-[0.2em]">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen">
      <div className="sticky top-[61px] z-20 flex items-center justify-between border-b border-black/10 bg-white/95 px-5 py-4 backdrop-blur md:top-0 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4">
          <Link to="/admin/products" className="p-2 transition-colors hover:bg-black hover:text-white" aria-label="Back to products">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">
              {isEditing ? "Editing product" : "New product"}
            </p>
            <p className="max-w-[150px] truncate font-serif text-xl sm:max-w-none">
              {name || "Untitled piece"}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSaving || categoriesLoading || categoriesError}
          className="flex items-center gap-2 bg-black px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-75 disabled:opacity-40 sm:px-6"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span className="hidden sm:inline">{isSaving ? "Saving" : "Save product"}</span>
          <span className="sm:hidden">Save</span>
        </button>
      </div>

      <div className="grid gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-12 lg:py-12 xl:grid-cols-[minmax(0,760px)_420px] xl:justify-between">
        <div className="space-y-10">
          {formError && (
            <div role="alert" className="border border-black bg-white p-5 text-sm leading-relaxed">
              <p className="text-[10px] uppercase tracking-[0.2em]">Please check the product</p>
              <p className="mt-2 text-black/60">{formError}</p>
            </div>
          )}

          <section className="border border-black/10 bg-white p-5 sm:p-7">
            <div className="mb-7">
              <p className="text-[10px] uppercase tracking-[0.24em] text-black/40">01</p>
              <h2 className="mt-1 font-serif text-3xl">Product details</h2>
            </div>
            <div className="space-y-6">
              <Field label="Name" htmlFor="name">
                <input id="name" value={name} onChange={(event) => handleNameChange(event.target.value)} className={inputClass} placeholder="The Auri Dress" required />
              </Field>
              <Field label="Product ID / URL slug" htmlFor="product-id" hint={isEditing ? "Cannot be changed" : "Generated from name"}>
                <input
                  id="product-id"
                  value={productId}
                  onChange={(event) => {
                    setIdWasEdited(true);
                    setProductId(slugify(event.target.value));
                  }}
                  className={`${inputClass} font-mono text-xs disabled:bg-black/5 disabled:text-black/45`}
                  placeholder="the-auri-dress"
                  disabled={isEditing}
                  required
                />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Price (ZAR)" htmlFor="price">
                  <input id="price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass} placeholder="680.00" required />
                </Field>
                <Field label="Display order" htmlFor="sort-order" hint="Lower appears first">
                  <input id="sort-order" type="number" step="1" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Description" htmlFor="description">
                <textarea id="description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} resize-y`} placeholder="Describe the silhouette, fit, and feeling of the piece." />
              </Field>
            </div>
          </section>

          <section className="border border-black/10 bg-white p-5 sm:p-7">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-black/40">02</p>
                <h2 className="mt-1 font-serif text-3xl">Images</h2>
              </div>
              <p className="text-[10px] text-black/40">{images.length}/10</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 border border-dashed border-black/35 px-5 py-8 text-xs uppercase tracking-[0.18em] transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              <ImagePlus size={19} /> Choose images
            </button>
            <p className="mt-3 text-[10px] leading-relaxed text-black/40">
              JPG, PNG or WebP, up to 10 MB each. The first image is the storefront cover.
            </p>

            {images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.map((image, index) => (
                  <div key={image.key} className="group relative aspect-[3/4] overflow-hidden bg-black/5">
                    {image.preview ? (
                      <img src={image.preview} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-black/35">Unavailable</div>
                    )}
                    {index === 0 && (
                      <span className="absolute left-2 top-2 bg-black px-2 py-1 text-[8px] uppercase tracking-[0.15em] text-white">Cover</span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/85 p-1 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="p-2 disabled:opacity-20" aria-label="Move image left">
                        <ChevronLeft size={16} />
                      </button>
                      <button type="button" onClick={() => removeImage(index)} className="p-2" aria-label="Remove image">
                        <Trash2 size={15} />
                      </button>
                      <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="p-2 disabled:opacity-20" aria-label="Move image right">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border border-black/10 bg-white p-5 sm:p-7">
            <div className="mb-7">
              <p className="text-[10px] uppercase tracking-[0.24em] text-black/40">03</p>
              <h2 className="mt-1 font-serif text-3xl">Garment information</h2>
            </div>
            <div className="space-y-6">
              <Field label="Available sizes" htmlFor="sizes" hint="Separate with commas">
                <input id="sizes" value={sizes} onChange={(event) => setSizes(event.target.value)} className={inputClass} placeholder="XS, S, M, L, XL" required />
              </Field>
              <Field label="Fabric" htmlFor="fabric">
                <input id="fabric" value={fabric} onChange={(event) => setFabric(event.target.value)} className={inputClass} placeholder="100% linen" />
              </Field>
              <Field label="Care" htmlFor="care">
                <input id="care" value={care} onChange={(event) => setCare(event.target.value)} className={inputClass} placeholder="Dry clean only" />
              </Field>
            </div>
          </section>

          <section className="border border-black/10 bg-white p-5 sm:p-7">
            <div className="mb-7">
              <p className="text-[10px] uppercase tracking-[0.24em] text-black/40">04</p>
              <h2 className="mt-1 font-serif text-3xl">Placement & publishing</h2>
            </div>
            <div className="space-y-7">
              {categoriesError && <p role="alert" className="text-sm">Categories could not be loaded. Please refresh before saving.</p>}
              <Field label="Product category" htmlFor="product-category">
                <select
                  id="product-category"
                  value={productCategoryId}
                  onChange={(event) => setProductCategoryId(event.target.value)}
                  className={inputClass}
                  disabled={categoriesLoading || categoriesError}
                  required
                >
                  <option value="">Choose a category</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id} disabled={!item.is_active}>
                      {item.name}{item.is_active ? "" : " (Inactive)"}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-xs leading-relaxed text-black/50">Choose the category shoppers will find this piece under. Every saved product needs an active category.</p>
              <fieldset className="space-y-4 border border-black/20 p-4">
                <legend className="px-2 text-[10px] uppercase tracking-[0.2em]">Homepage selection</legend>
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} className="h-4 w-4 accent-black" />
                  Featured piece
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={isBestseller} onChange={(event) => setIsBestseller(event.target.checked)} className="h-4 w-4 accent-black" />
                  Bestseller
                </label>
                <p className="text-xs leading-relaxed text-black/50">Active pieces with either selection appear in Most Loved. The first four by display order are shown. Clear both to remove a piece.</p>
              </fieldset>
              <Field label="Collection placement" htmlFor="category">
                <select id="category" value={category} onChange={(event) => setCategory(event.target.value as "new" | "collection")} className={inputClass}>
                  <option value="collection">Collection</option>
                  <option value="new">New arrivals</option>
                </select>
              </Field>
              <div className="flex items-center justify-between border border-black/20 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em]">Storefront visibility</p>
                  <p className="mt-1 text-xs text-black/45">{isActive ? "Visible to customers" : "Saved as a hidden draft"}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((value) => !value)}
                  className={`relative h-7 w-12 border border-black transition-colors ${isActive ? "bg-black" : "bg-white"}`}
                >
                  <span className={`absolute top-1 h-[18px] w-[18px] transition-all ${isActive ? "left-6 bg-white" : "left-1 bg-black"}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 border border-black/10 bg-white p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-black/40">Storefront preview</p>
            <div className="mt-5 flex aspect-[3/4] items-center justify-center overflow-hidden bg-black/5">
              {images[0]?.preview ? (
                <img src={images[0].preview} alt="Product cover preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={28} className="text-black/20" />
              )}
            </div>
            <h3 className="mt-5 font-serif text-2xl">{name || "Product name"}</h3>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm">{price ? `R${Number(price).toFixed(2)}` : "R0.00"}</p>
              <span className={`px-2 py-1 text-[8px] uppercase tracking-[0.16em] ${isActive ? "bg-black text-white" : "border border-black/20 text-black/45"}`}>
                {isActive ? "Active" : "Draft"}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
};

export default function AdminProductEditorRoute() {
  const { id } = useParams();
  return <AdminProductEditor key={id ?? "new"} />;
}
