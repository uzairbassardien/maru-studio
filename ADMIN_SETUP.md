# Maru by Maru admin setup

## 1. Apply the migrations

Apply all files in `supabase/migrations` to the linked Supabase project, in
filename order. The migrations create the role table, authorization helper,
product CRUD policies, private bucket write policies, seeded product
categories, orders, order items, and the secure customer checkout function.

## 2. Create the admin login

In Supabase Dashboard, open **Authentication > Users > Add user** and create
the admin with an email and password. Disable public email/password sign-ups in
**Authentication > Providers > Email** so visitors cannot create accounts.

## 3. Give that user the admin role

Run this in the Supabase SQL editor after replacing the email:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = lower('admin@example.com')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

The query should report one affected row. If it reports zero, confirm that the
user already exists and that the email is correct.

You can alternatively assign the role by the UUID shown in Authentication:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE-AUTH-USER-UUID-HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

Open `/admin/login` in the deployed site to sign in. There is intentionally no
admin registration page and no admin link in the public navigation.

Successful sign-in opens `/admin`, the live overview dashboard. Catalogue
management is at `/admin/products`, product creation at `/admin/products/new`,
and order management at `/admin/orders`.

## Homepage merchandising

Apply `supabase/migrations/20260926180000_product_merchandising.sql` to enable
Featured piece and Bestseller selections in the product editor. The homepage
uses these flags for Most Loved. Category assignment is also available directly
on the admin product list; use **Needs a category** to finish assigning older
products. See `STOREFRONT_UPDATES.md` for details and remaining business content.

## Order flow

Customers review their cart and continue to `/checkout`. The browser calls the
`place_order` database function, which validates every active product and size,
uses current database prices, and inserts the order and all order items in one
transaction. Anonymous customers do not have direct access to either order
table. Admins can manage orders at `/admin/orders`.
