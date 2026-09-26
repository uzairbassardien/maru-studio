-- Product taxonomy ----------------------------------------------------------

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.categories (name, slug, sort_order)
VALUES
  ('Dresses', 'dresses', 10),
  ('Tops', 'tops', 20),
  ('Outerwear', 'outerwear', 30),
  ('Accessories', 'accessories', 40)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

ALTER TABLE public.products
ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.products.category IS
  'Merchandising placement: new or collection. Product type is category_id.';

CREATE INDEX products_category_id_idx ON public.products(category_id);

-- Best-effort assignment for existing products. Anything ambiguous remains
-- uncategorized so an admin can choose the correct category.
UPDATE public.products AS product
SET category_id = category.id
FROM public.categories AS category
WHERE product.category_id IS NULL
  AND category.slug = CASE
    WHEN lower(product.name) ~ '(jacket|coat|trench)' THEN 'outerwear'
    WHEN lower(product.name) ~ '(top|tee|shirt|blouse)' THEN 'tops'
    WHEN lower(product.name) ~ '(dress|gown)' THEN 'dresses'
    ELSE NULL
  END;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.categories TO authenticated;

CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all categories"
ON public.categories
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY "Admins can create categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));

CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders --------------------------------------------------------------------

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled')),
  customer_first_name text NOT NULL,
  customer_last_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address_line_1 text NOT NULL,
  shipping_address_line_2 text NOT NULL DEFAULT '',
  shipping_city text NOT NULL,
  shipping_province text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_country text NOT NULL DEFAULT 'South Africa',
  customer_notes text NOT NULL DEFAULT '',
  admin_notes text NOT NULL DEFAULT '',
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image_path text NOT NULL DEFAULT '',
  size text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 10),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id, size)
);

CREATE INDEX orders_status_created_at_idx ON public.orders(status, created_at DESC);
CREATE INDEX orders_customer_email_idx ON public.orders(lower(customer_email));
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.order_items FROM anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;

CREATE POLICY "Admins can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can view order items"
ON public.order_items
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customers never insert prices or order rows directly. This function validates
-- the cart, reads current prices from products, and creates the complete order
-- in one transaction.
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_product_id text;
  v_size text;
  v_quantity integer;
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
BEGIN
  IF p_customer IS NULL OR jsonb_typeof(p_customer) <> 'object' THEN
    RAISE EXCEPTION 'Customer details are required';
  END IF;

  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0
     OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'An order must contain between 1 and 50 items';
  END IF;

  IF nullif(btrim(p_customer->>'first_name'), '') IS NULL
     OR nullif(btrim(p_customer->>'last_name'), '') IS NULL
     OR nullif(btrim(p_customer->>'email'), '') IS NULL
     OR nullif(btrim(p_customer->>'phone'), '') IS NULL
     OR nullif(btrim(p_customer->>'address_line_1'), '') IS NULL
     OR nullif(btrim(p_customer->>'city'), '') IS NULL
     OR nullif(btrim(p_customer->>'province'), '') IS NULL
     OR nullif(btrim(p_customer->>'postal_code'), '') IS NULL THEN
    RAISE EXCEPTION 'Complete all required customer and delivery fields';
  END IF;

  IF char_length(p_customer->>'first_name') > 100
     OR char_length(p_customer->>'last_name') > 100
     OR char_length(p_customer->>'email') > 320
     OR char_length(p_customer->>'phone') > 50
     OR char_length(p_customer->>'address_line_1') > 250
     OR char_length(coalesce(p_customer->>'address_line_2', '')) > 250
     OR char_length(p_customer->>'city') > 120
     OR char_length(p_customer->>'province') > 120
     OR char_length(p_customer->>'postal_code') > 30
     OR char_length(coalesce(p_customer->>'country', '')) > 120
     OR char_length(coalesce(p_customer->>'notes', '')) > 1000 THEN
    RAISE EXCEPTION 'One or more customer fields are too long';
  END IF;

  IF lower(p_customer->>'email') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;

  v_order_number := 'MBM-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' ||
    upper(substring(replace(v_order_id::text, '-', '') FROM 1 FOR 10));

  INSERT INTO public.orders (
    id,
    order_number,
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    shipping_address_line_1,
    shipping_address_line_2,
    shipping_city,
    shipping_province,
    shipping_postal_code,
    shipping_country,
    customer_notes
  ) VALUES (
    v_order_id,
    v_order_number,
    btrim(p_customer->>'first_name'),
    btrim(p_customer->>'last_name'),
    lower(btrim(p_customer->>'email')),
    btrim(p_customer->>'phone'),
    btrim(p_customer->>'address_line_1'),
    btrim(coalesce(p_customer->>'address_line_2', '')),
    btrim(p_customer->>'city'),
    btrim(p_customer->>'province'),
    btrim(p_customer->>'postal_code'),
    coalesce(nullif(btrim(p_customer->>'country'), ''), 'South Africa'),
    btrim(coalesce(p_customer->>'notes', ''))
  );

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := nullif(btrim(v_item->>'product_id'), '');
    v_size := nullif(btrim(v_item->>'size'), '');

    IF v_product_id IS NULL OR v_size IS NULL
       OR coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]*$' THEN
      RAISE EXCEPTION 'An order item is invalid';
    END IF;

    v_quantity := (v_item->>'quantity')::integer;
    IF v_quantity > 10 THEN
      RAISE EXCEPTION 'A maximum of 10 units is allowed per item';
    END IF;

    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_product_id
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product is unavailable: %', v_product_id;
    END IF;

    IF NOT (v_size = ANY(v_product.sizes)) THEN
      RAISE EXCEPTION 'Size % is unavailable for %', v_size, v_product.name;
    END IF;

    v_line_total := round(v_product.price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_image_path,
      size,
      quantity,
      unit_price,
      line_total
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      coalesce(v_product.images[1], ''),
      v_size,
      v_quantity,
      v_product.price,
      v_line_total
    );
  END LOOP;

  UPDATE public.orders
  SET subtotal = v_subtotal,
      total = v_subtotal + shipping_amount
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'total', v_subtotal
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;
