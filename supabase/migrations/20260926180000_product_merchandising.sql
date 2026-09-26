-- Homepage curation; existing product/storage RLS continues to protect writes.
ALTER TABLE public.products
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN is_bestseller boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.is_featured IS 'Editorial selection for the Most Loved homepage section.';
COMMENT ON COLUMN public.products.is_bestseller IS 'Admin-selected bestseller; also appears in Most Loved.';

-- Preserve the storefront's existing bestseller selection in data.
UPDATE public.products SET is_bestseller = true
WHERE id IN ('elan-cropped-trench-jacket-beige', 'elan-cropped-trench-jacket-black');

-- Carry forward the former featured collection (first four published pieces).
UPDATE public.products SET is_featured = true
WHERE id IN (
  SELECT id FROM public.products WHERE is_active ORDER BY sort_order, id LIMIT 4
);

-- Category assignment remains through the existing categories foreign key.
-- Do not guess a category for existing ambiguous products such as skirts.
-- Admins must choose an active category in the editor before saving.
