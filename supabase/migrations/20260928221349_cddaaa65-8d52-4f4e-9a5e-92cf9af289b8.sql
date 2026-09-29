CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  max_uses_per_customer integer NOT NULL DEFAULT 1 CHECK (max_uses_per_customer > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (discount_type <> 'percentage' OR discount_value <= 100)
);
CREATE UNIQUE INDEX coupons_code_upper_idx ON public.coupons (upper(code));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  discount_amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coupon_redemptions_coupon_email_idx ON public.coupon_redemptions (coupon_id, customer_email);
GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

ALTER TABLE public.orders
  ADD COLUMN discount_code text NOT NULL DEFAULT '',
  ADD COLUMN discount_amount numeric(12,2) NOT NULL DEFAULT 0;

-- Shared validator: returns discount amount or raises a friendly error
CREATE OR REPLACE FUNCTION public._coupon_discount(p_code text, p_email text, p_subtotal numeric, p_lock boolean)
RETURNS TABLE(coupon_id uuid, code text, discount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  v_email text := lower(btrim(coalesce(p_email,'')));
  v_used integer;
  v_discount numeric(12,2);
BEGIN
  IF p_lock THEN
    SELECT * INTO c FROM public.coupons WHERE upper(public.coupons.code) = upper(btrim(p_code)) FOR UPDATE;
  ELSE
    SELECT * INTO c FROM public.coupons WHERE upper(public.coupons.code) = upper(btrim(p_code));
  END IF;
  IF NOT FOUND OR NOT c.is_active THEN RAISE EXCEPTION 'This discount code is not valid.'; END IF;
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN RAISE EXCEPTION 'This discount code is not active yet.'; END IF;
  IF c.ends_at IS NOT NULL AND now() > c.ends_at THEN RAISE EXCEPTION 'This discount code has expired.'; END IF;
  IF c.max_uses IS NOT NULL THEN
    SELECT count(*) INTO v_used FROM public.coupon_redemptions r WHERE r.coupon_id = c.id;
    IF v_used >= c.max_uses THEN RAISE EXCEPTION 'This discount code has reached its usage limit.'; END IF;
  END IF;
  IF v_email <> '' THEN
    SELECT count(*) INTO v_used FROM public.coupon_redemptions r WHERE r.coupon_id = c.id AND r.customer_email = v_email;
    IF v_used >= c.max_uses_per_customer THEN
      IF c.max_uses_per_customer = 1 THEN
        RAISE EXCEPTION 'You have already used this discount code. It can only be claimed once per customer.';
      ELSE
        RAISE EXCEPTION 'You have already used this discount code the maximum number of times.';
      END IF;
    END IF;
  END IF;
  IF p_subtotal < c.min_order_amount THEN
    RAISE EXCEPTION 'This code requires a minimum order of R%.', to_char(c.min_order_amount, 'FM999999990.00');
  END IF;
  IF c.discount_type = 'percentage' THEN
    v_discount := round(p_subtotal * c.discount_value / 100, 2);
  ELSE
    v_discount := least(c.discount_value, p_subtotal);
  END IF;
  RETURN QUERY SELECT c.id, c.code, v_discount;
END;
$$;
REVOKE ALL ON FUNCTION public._coupon_discount(text, text, numeric, boolean) FROM PUBLIC, anon, authenticated;

-- Checkout preview: computes subtotal from real prices
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_email text, p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  v_subtotal numeric(12,2) := 0;
  r record;
BEGIN
  IF p_code IS NULL OR btrim(p_code) = '' OR char_length(p_code) > 50 THEN
    RAISE EXCEPTION 'Enter a discount code.';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Your cart is invalid.';
  END IF;
  SELECT coalesce(sum(p.price * least(greatest((i->>'quantity')::int,1),10)),0) INTO v_subtotal
  FROM jsonb_array_elements(p_items) i
  JOIN public.products p ON p.id = i->>'product_id' AND p.is_active;
  SELECT * INTO r FROM public._coupon_discount(p_code, p_email, v_subtotal, false);
  RETURN jsonb_build_object('code', r.code, 'discount', r.discount, 'subtotal', v_subtotal);
END;
$$;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, text, jsonb) TO anon, authenticated;

-- Order placement with optional coupon
CREATE OR REPLACE FUNCTION public.place_order(p_customer jsonb, p_items jsonb, p_coupon_code text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  v_discount numeric(12,2) := 0;
  v_code text := '';
  v_coupon record;
  v_total numeric(12,2);
BEGIN
  IF p_customer IS NULL OR jsonb_typeof(p_customer) <> 'object' THEN
    RAISE EXCEPTION 'Customer details are required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 50 THEN
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
     OR char_length(coalesce(p_customer->>'notes', '')) > 1000
     OR char_length(coalesce(p_coupon_code, '')) > 50 THEN
    RAISE EXCEPTION 'One or more customer fields are too long';
  END IF;
  IF lower(p_customer->>'email') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;

  v_order_number := 'MBM-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' ||
    upper(substring(replace(v_order_id::text, '-', '') FROM 1 FOR 10));

  INSERT INTO public.orders (
    id, order_number, customer_first_name, customer_last_name, customer_email, customer_phone,
    shipping_address_line_1, shipping_address_line_2, shipping_city, shipping_province,
    shipping_postal_code, shipping_country, customer_notes
  ) VALUES (
    v_order_id, v_order_number,
    btrim(p_customer->>'first_name'), btrim(p_customer->>'last_name'),
    lower(btrim(p_customer->>'email')), btrim(p_customer->>'phone'),
    btrim(p_customer->>'address_line_1'), btrim(coalesce(p_customer->>'address_line_2', '')),
    btrim(p_customer->>'city'), btrim(p_customer->>'province'), btrim(p_customer->>'postal_code'),
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
    SELECT * INTO v_product FROM public.products WHERE id = v_product_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product is unavailable: %', v_product_id;
    END IF;
    IF NOT (v_size = ANY(v_product.sizes)) THEN
      RAISE EXCEPTION 'Size % is unavailable for %', v_size, v_product.name;
    END IF;
    v_line_total := round(v_product.price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image_path, size, quantity, unit_price, line_total
    ) VALUES (
      v_order_id, v_product.id, v_product.name, coalesce(v_product.images[1], ''),
      v_size, v_quantity, v_product.price, v_line_total
    );
  END LOOP;

  IF nullif(btrim(coalesce(p_coupon_code, '')), '') IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public._coupon_discount(p_coupon_code, p_customer->>'email', v_subtotal, true);
    v_discount := v_coupon.discount;
    v_code := v_coupon.code;
    INSERT INTO public.coupon_redemptions (coupon_id, order_id, customer_email, customer_name, discount_amount)
    VALUES (v_coupon.coupon_id, v_order_id, lower(btrim(p_customer->>'email')),
      btrim(p_customer->>'first_name') || ' ' || btrim(p_customer->>'last_name'), v_discount);
  END IF;

  UPDATE public.orders
  SET subtotal = v_subtotal,
      discount_code = v_code,
      discount_amount = v_discount,
      total = greatest(v_subtotal - v_discount, 0) + shipping_amount
  WHERE id = v_order_id
  RETURNING total INTO v_total;

  RETURN jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number,
    'subtotal', v_subtotal, 'discount', v_discount, 'total', v_total
  );
END;
$function$;
DROP FUNCTION IF EXISTS public.place_order(jsonb, jsonb);
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text) TO anon, authenticated;