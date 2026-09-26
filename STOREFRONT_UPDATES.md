# Maru storefront refinements

## The Maru Woman gallery

- `SocialGallery.tsx` uses every active product returned by the existing Supabase
  hook, with signed images and links to product details.
- Two matching image sequences create a continuous linear loop, with soft masks
  at both edges. Hover and touch do not pause the animation. Small catalogues
  repeat enough images to fill the viewport without blank gaps.
- Loading skeletons and empty/error states are included. System reduced-motion
  preferences switch to a manually scrollable row with duplicate images hidden.
- Build, TypeScript, targeted lint and seven existing tests pass. Browser checks
  verified all products, matching loop widths, hover playback, edge fades and no
  overflow at 320, 390, 768 and 1440px, plus a single-product catalogue.

## Hero and product loading polish

- Removed the hero playback icon. The video still respects reduced motion.
- The collection CTA now has a transparent background and white border, with a
  white fill animation and black text on hover or keyboard focus.
- Added reusable product card/detail/list skeletons. Loading placeholders cover
  homepage product grids, categories and gallery, the shop, product details and
  admin product list/editor. Skeletons are static with reduced motion enabled.
- Build, TypeScript, targeted lint and all seven existing tests pass. A focused
  browser check delayed mock product responses to verify skeletons appear and
  resolve, checked the hero animation and reduced motion, and found no page errors.

## About and Shop refinement

- About now has an editorial introduction, an image/story split, three brand
  principles and a closing collection invitation, using existing brand imagery.
- Shop has a sticky desktop sidebar and an accessible mobile filter drawer.
  Categories, size options and merchandising selections use existing Supabase
  data. Price limits are inclusive and entered in ZAR.
- Category, collection, size, price and sorting selections stay in the URL for
  refresh, sharing and browser history. Active filters can be removed individually
  or cleared together; empty selections offer a reset.
- The compact product grid uses four columns on desktop, three on tablet and two
  on mobile. Existing product cards, signed images and product links are reused.
- Added `ShopFilters.tsx`; updated `About.tsx`, `Shop.tsx`, `ProductGrid.tsx`,
  `ProductCard.tsx` and the existing unit/browser checks. No database changes.
- Verification: production build, TypeScript and targeted ESLint pass; all seven
  tests pass. Browser checks cover both pages at 320, 375, 390, 430, 768, 1024 and
  1440px, mobile filter apply/reset, desktop sidebar scrolling, and the existing
  product/cart/checkout flows with intercepted writes. No fixture browser errors.

## Files changed in this refinement

- `src/pages/Index.tsx`, `src/pages/Shop.tsx`: homepage composition and URL filters.
- `src/components/ProductCard.tsx`, `Navbar.tsx`, `Footer.tsx`: image hover,
  mobile navigation and organized footer links.
- `src/components/storefront/`: new `Hero`, `SectionHeading`, `CategoryCard`,
  `ProductGrid`, and `NewsletterSection` components.
- `src/pages/StoreInformation.tsx`, `src/App.tsx`: shared information-page
  layout and seven working routes.
- `src/pages/admin/AdminDashboard.tsx`, `AdminProductEditor.tsx`: quick category
  assignment, missing-category filter and merchandising controls.
- `src/pages/admin/AdminOverview.tsx`, `src/components/admin/AdminLayout.tsx`:
  default admin overview, live operational metrics and revised admin navigation.
- `src/hooks/useProducts.ts`, `useCategories.ts`, `src/data/products.ts`,
  `src/integrations/supabase/types.ts`: database fields and public category scope.
- `src/index.css`, `src/pages/ProductDetail.tsx`: reduced motion, shared spacing,
  image hover, keyboard focus and wrapping mobile size buttons.
- New merchandising migration, `src/test/storefront.test.tsx`,
  `scripts/check-storefront.mjs`, `ADMIN_SETUP.md` and this handoff.

## Activate the homepage selection

Run `supabase/migrations/20260926180000_product_merchandising.sql` after the
existing migrations. This adds `is_featured` and `is_bestseller` to products and
seeds the former featured collection and the two existing trench bestsellers.
No orders, checkout functions, storage policies, or auth policies are changed.
The latest read-only check confirms these merchandising columns are now present
in the connected project. Fresh environments must still run this migration.

In **Admin → Products**, choose a category directly on a product row. Use the
**Needs a category** filter to find older unassigned pieces or pieces whose
category is inactive. The editor requires an active database category before
saving. Existing ambiguous products remain unassigned until the admin makes
that choice; there is no automatic reclassification of skirts as dresses.

In **Edit product → Placement & publishing**, select **Featured piece** or
**Bestseller** to include a published product in **Most Loved**. Clear both to
remove it. The first four selected active products by display order are shown.
Use the existing **Collection placement → New arrivals** setting for the first
six products in the homepage New Arrivals section. Display order controls both.

## Storefront changes

- Hero: original video and heading, two refined CTAs, pause control and motion preferences.
- Collection: database categories, each using the first assigned product image.
  Empty categories use existing brand imagery until a product is assigned.
- Shop: persistent URL filters (`?category=tops`, `?collection=new`), which can
  be combined and bookmarked. Inactive categories are excluded from public queries.
- Product cards: existing component reused with second-image hover on desktop.
- Editorial: existing skirt image and stacked Maru typography with simpler copy.
- Most Loved: database-controlled merchandising, with no hardcoded product fallback.
- Brand story, three existing testimonials, product-based social gallery,
  neutral shopping benefits and a separate newsletter section.
- Footer: links to new contact, delivery, returns, size guide, FAQ, privacy and
  terms pages; no dead links or placeholder `#` anchors.

## Business information still needed

- Confirmed Instagram URL. The social handle is text until this is supplied.
- Newsletter service and signup endpoint. The old footer form only changed
  local UI state. The new form validates input but explicitly says subscriptions
  are not open; it neither saves email addresses nor reports false success.
- Customer support email/phone and the return/exchange process.
- Approved full privacy policy and trading terms. Their pages currently explain
  what the site does and say the full documents are being prepared.
- Confirm the existing product-page shipping (complimentary, 5–7 business days)
  and returns (14 days, unworn with tags) text reused on the information pages.
- A confirmed sizing system and garment measurements. The existing bare size
  conversion numbers do not identify a regional sizing standard.
- Confirmation/permission for the existing testimonial content. No verified
  labels or ratings have been added.

## Verification

`npm test` includes regression coverage for database category IDs, URL filters,
invalid category links, combined category/new filters, and homepage product caps.

`scripts/check-storefront.mjs` runs Chrome at 320, 375, 390, 430, 768, 1024 and
1440px. It checks overflow, category columns, reduced motion, navigation,
cart/checkout, information pages and admin category/merchandising updates.
All test writes are intercepted. A separate context checks live public data
read-only. Screenshots are stored under `node_modules/.maru-browser/artifacts`.
The script documents its optional isolated Playwright dependency and expects
the local Vite server at `http://127.0.0.1:5173` and installed Chrome.

Verified for this change: production build and TypeScript pass; all five unit
tests pass; changed source files pass ESLint. Chrome checks passed at all seven
widths, including category navigation, desktop image hover, mobile cart checkout,
and mocked admin writes. Live public products/categories returned HTTP 200;
all homepage images loaded and no console errors/runtime exceptions occurred.

The latest read-only live check found 12 active products, all assigned to
categories, with the merchandising columns available. No live admin changes or
order submissions were made by tests.

Repository-wide lint still has four pre-existing errors in `ui/command.tsx`,
`ui/textarea.tsx`, `previewAuthStorage.ts`, and `tailwind.config.ts`. The build
also reports the existing large-bundle and outdated Browserslist data warnings.
