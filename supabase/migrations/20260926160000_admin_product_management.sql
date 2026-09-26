-- Admin authorization is stored separately from auth.users so roles cannot be
-- assigned by editing user-controlled profile metadata.
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = 'admin'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_roles FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- SECURITY DEFINER lets RLS policies check the protected role table without
-- granting clients permission to create or change roles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY "Admins can create products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin()));

-- Keep the bucket private. The storefront reads paths through short-lived
-- signed URLs, while only admins may mutate objects.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (SELECT public.is_admin())
);

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (SELECT public.is_admin())
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (SELECT public.is_admin())
);

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (SELECT public.is_admin())
);

