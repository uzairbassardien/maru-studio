// Run with the local Vite server on :5173. Test dependencies are isolated:
// npm install --prefix node_modules/.maru-browser --no-save --package-lock=false playwright
// node scripts/check-storefront.mjs
import { chromium } from '../node_modules/.maru-browser/node_modules/playwright/index.mjs';
import { mkdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:5173';
const output = 'node_modules/.maru-browser/artifacts';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const categories = ['Dresses', 'Tops', 'Outerwear', 'Accessories'].map((name, index) => ({
    id: `category-${index}`, name, slug: name.toLowerCase(), is_active: true, sort_order: index,
  }));
  const files = ['The_AURI_Dress680.JPEG', 'LOVA_top350.JPEG', 'ELAN_Cropped_Trench_Jacket-beige590.jpeg', 'Elysia1000.jpg', 'VELA_Striped_knitted_dress650.jpeg', 'Satin_lace_trim_top-white390.JPEG', 'Pink_Knitted_tee350.JPEG', 'Linea-brown850.jpg'];
  const products = files.map((file, index) => ({
    id: `piece-${index}`, name: `Maru piece ${index}`, price: 680, images: [file, files[(index + 1) % files.length]], sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'A refined piece from Maru.', fabric: 'Linen', care: 'Dry clean', category: index < 7 ? 'new' : 'collection', category_id: `category-${index % 4}`,
    is_active: true, is_featured: index < 4, is_bestseller: false, sort_order: index, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }));
  const orders = [
    { id: 'order-1', order_number: 'MBM-001', status: 'new', customer_first_name: 'Amina', customer_last_name: 'K', customer_email: 'amina@example.com', customer_phone: '0123456789', shipping_address_line_1: '1 Test Road', shipping_address_line_2: '', shipping_city: 'Cape Town', shipping_province: 'Western Cape', shipping_postal_code: '8001', shipping_country: 'South Africa', customer_notes: '', admin_notes: '', subtotal: 1360, shipping_amount: 0, total: 1360, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'order-2', order_number: 'MBM-002', status: 'processing', customer_first_name: 'Sarah', customer_last_name: 'M', customer_email: 'sarah@example.com', customer_phone: '0123456789', shipping_address_line_1: '2 Test Road', shipping_address_line_2: '', shipping_city: 'Johannesburg', shipping_province: 'Gauteng', shipping_postal_code: '2000', shipping_country: 'South Africa', customer_notes: '', admin_notes: '', subtotal: 680, shipping_amount: 0, total: 680, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  ];
  const mutations = [];
  // Every Supabase request in this context is intercepted. No test orders or
  // product updates reach the actual database.
  await context.route('**/*.supabase.co/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const json = value => route.fulfill({ json: value });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 200 });
    if (url.pathname === '/rest/v1/categories') return json(categories);
    if (url.pathname === '/rest/v1/orders') return json(orders);
    if (url.pathname === '/rest/v1/products') {
      if (request.method() === 'PATCH') {
        const id = url.searchParams.get('id').replace('eq.', '');
        const body = request.postDataJSON();
        Object.assign(products.find(item => item.id === id), body);
        mutations.push({ id, ...body });
        return json({ id });
      }
      return json(products);
    }
    if (url.pathname === '/storage/v1/object/sign/product-images') return json(request.postDataJSON().paths.map(path => ({ path, error: null, signedURL: `/fixture/${encodeURIComponent(path)}` })));
    if (url.pathname.startsWith('/storage/v1/fixture/')) {
      const file = decodeURIComponent(url.pathname.split('/').pop());
      return route.fulfill({ body: await readFile(`public/${file}`), contentType: 'image/jpeg' });
    }
    if (url.pathname === '/rest/v1/rpc/is_admin') return json(true);
    if (url.pathname === '/rest/v1/rpc/place_order') return json({ id: 'test-order', order_number: 'MBM-TEST', total: 680 });
    return json({});
  });

  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    await page.getByRole('heading', { name: 'Most Loved', exact: true }).waitFor();
    await page.getByRole('link', { name: /Dresses.*Explore/ }).waitFor();
    // Scroll through lazy images before capturing the page.
    for (let position = 0; position < await page.locator('body').evaluate(el => el.scrollHeight); position += 800) {
      await page.evaluate(y => window.scrollTo(0, y), position);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `homepage overflow at ${width}px`);
    const categoryColumns = await page.getByRole('region', { name: 'Shop by category' }).locator('.grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(categoryColumns, width < 1024 ? 2 : 4);
    assert.equal(await page.locator('video').evaluate(el => el.paused), true, 'reduced motion pauses hero');
    await page.screenshot({ path: `${output}/homepage-${width}.png`, fullPage: true });
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `${output}/hero-${width}.png` });
      await page.getByRole('region', { name: 'Shop by category' }).screenshot({ path: `${output}/categories-${width}.png` });
    }
    console.log(`PASS homepage ${width}px, categories ${categoryColumns} columns, reduced motion`);
  }

  await page.locator('.product-card').first().hover();
  assert.equal(await page.locator('.product-card-alternate').first().evaluate(el => getComputedStyle(el).opacity), '1', 'desktop second-image hover');
  await page.getByRole('link', { name: /Tops.*Explore/ }).click();
  await page.waitForURL('**/shop?category=tops');
  await page.getByRole('heading', { name: 'Tops', exact: true }).waitFor();
  assert.equal(await page.locator('.product-card').count(), 2);
  await page.reload();
  await page.locator('.product-card').first().waitFor();
  assert.equal(await page.locator('.product-card').count(), 2, 'category survives reload');
  await page.goto(`${base}/shop?category=tops&collection=new`);
  await page.locator('.product-card').first().waitFor();
  assert.equal(await page.locator('.product-card').count(), 2);
  await page.goto(`${base}/shop?category=invalid`);
  await page.getByText(/This category is unavailable/).waitFor();
  console.log('PASS category links, refresh, combined and invalid filters');

  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/shop`);
    await page.locator('.product-card').first().waitFor();
    const grid = page.getByRole('region', { name: 'Shop products' }).locator('.grid');
    const columns = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width >= 1024 ? 4 : width >= 640 ? 3 : 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `shop overflow at ${width}`);
    if (width >= 1024) {
      // Give the catalogue enough rows to test sticking before its footer boundary.
      const extra = products.map(product => ({ ...product, id: `${product.id}-extra` }));
      products.push(...extra, ...extra.map(product => ({ ...product, id: `${product.id}-more` })));
      await page.reload();
      await page.locator('.product-card').nth(23).waitFor();
      await page.evaluate(() => window.scrollTo(0, 400));
      const sidebar = await page.getByRole('complementary', { name: 'Shop filters' }).boundingBox();
      assert.ok(sidebar.y >= 64 && sidebar.y <= 100, 'filters remain below navbar while scrolling');
      await page.evaluate(() => window.scrollTo(0, 0));
      products.splice(8);
    } else {
      await page.getByRole('button', { name: 'Filters', exact: true }).click();
      const panel = page.getByRole('dialog');
      await panel.getByRole('button', { name: 'Tops', exact: true }).click();
      await panel.getByLabel('Maximum price').fill('600');
      await panel.getByRole('button', { name: 'Apply price' }).click();
      await panel.getByRole('button', { name: 'View 0 pieces' }).click();
      await page.getByText(/No pieces match/).waitFor();
      await page.getByRole('button', { name: 'Filters (2)', exact: true }).click();
      await panel.getByRole('button', { name: 'Clear all', exact: true }).click();
      await panel.getByRole('button', { name: 'View 8 pieces' }).click();
      assert.equal(await page.locator('.product-card').count(), 8);
    }
    await page.screenshot({ path: `${output}/shop-${width}.png`, fullPage: true });
    await page.goto(`${base}/about`);
    await page.getByRole('heading', { name: /Simplicity is/ }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `about overflow at ${width}`);
    await page.screenshot({ path: `${output}/about-${width}.png`, fullPage: true });
    console.log(`PASS shop/about ${width}px, ${columns} product columns, responsive filters`);
  }

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${base}/product/piece-0`);
  await page.getByRole('button', { name: 'XL', exact: true }).click();
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'Cart (1)', exact: true }).click();
  await page.getByRole('link', { name: 'Place Your Order', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'cart at 320px');
  await page.getByRole('link', { name: 'Place Your Order', exact: true }).click();
  for (const [label, value] of [['First name', 'Test'], ['Last name', 'Customer'], ['Email', 'test@example.com'], ['Phone', '0123456789'], ['Address', '1 Test Road'], ['City', 'Cape Town'], ['Province', 'Western Cape'], ['Postal code', '8001']]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole('button', { name: 'Place your order', exact: true }).click();
  await page.getByText('MBM-TEST', { exact: true }).waitFor();
  console.log('PASS product > size > cart > checkout with intercepted order RPC');

  for (const route of ['contact', 'shipping', 'returns', 'size-guide', 'faq', 'privacy', 'terms', 'about']) {
    await page.goto(`${base}/${route}`);
    assert.notEqual(await page.locator('h1').textContent(), '404');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow on ${route}`);
  }
  await page.goto(base);
  await page.getByLabel('Email address', { exact: true }).fill('test@example.com');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.getByText(/Sign-ups are not open yet/).waitFor();
  console.log('PASS footer routes, newsletter availability message');

  // Seed a test-only auth session in the isolated browser; role RPC is mocked.
  const env = await readFile('.env', 'utf8');
  const supabaseUrl = env.match(/^VITE_SUPABASE_URL=["']?([^\r\n"']+)/m)?.[1];
  assert.ok(supabaseUrl);
  const project = new URL(supabaseUrl).hostname.split('.')[0];
  await page.evaluate(({ project }) => {
    localStorage.setItem(`sb-${project}-auth-token`, JSON.stringify({
      access_token: 'test-token', refresh_token: 'test-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'test-admin', email: 'admin@example.com', aud: 'authenticated', role: 'authenticated' },
    }));
  }, { project });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/admin`);
  await page.getByRole('heading', { name: 'Welcome back.', exact: true }).waitFor();
  await page.getByText('R 2 040', { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/admin-dashboard-1440.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'admin dashboard at 1440px');
  await page.setViewportSize({ width: 320, height: 800 });
  await page.screenshot({ path: `${output}/admin-dashboard-320.png`, fullPage: true });
  const dashboardOverflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && el.getBoundingClientRect().width > 0).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width, text: el.textContent?.trim().slice(0, 30) })).slice(0, 12));
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) console.log('Dashboard overflow diagnostics:', JSON.stringify(dashboardOverflow));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'admin dashboard at 320px');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/admin/products`);
  await page.getByRole('combobox', { name: 'Category for Maru piece 0', exact: true }).selectOption('category-1');
  await page.getByText('Category updated', { exact: true }).waitFor();
  assert.ok(mutations.some(item => item.id === 'piece-0' && item.category_id === 'category-1'));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.screenshot({ path: `${output}/admin-320.png`, fullPage: true });
  const adminOverflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && el.getBoundingClientRect().width > 0).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width })).slice(0, 12));
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) console.log('Admin overflow diagnostics:', JSON.stringify(adminOverflow));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'admin catalogue at 320px');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/admin/products/piece-0/edit`);
  await page.getByRole('checkbox', { name: 'Featured piece', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'Bestseller', exact: true }).check();
  await page.getByRole('button', { name: /Save product/ }).click();
  await page.waitForURL(`${base}/admin/products`);
  assert.ok(mutations.some(item => item.id === 'piece-0' && item.is_featured === false && item.is_bestseller === true));
  console.log('PASS default dashboard, admin category and Most Loved updates (intercepted writes only)');
  assert.deepEqual(errors, [], 'browser runtime errors');
  console.log('PASS no runtime exceptions in fixture browser checks');
  await context.close();

  // Separate read-only smoke check against configured public Supabase data.
  const live = await browser.newContext();
  const livePage = await live.newPage();
  const liveErrors = [];
  livePage.on('pageerror', error => liveErrors.push(error.message));
  livePage.on('console', message => { if (message.type() === 'error') liveErrors.push(message.text()); });
  const status = [];
  let catalogueSummary = {};
  livePage.on('response', async response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/rest/v1/')) status.push({ path: url.pathname, status: response.status() });
    if (url.pathname === '/rest/v1/products' && response.ok()) {
      const rows = await response.json();
      catalogueSummary = { products: rows.length, needsCategory: rows.filter(row => !row.category_id).length, merchandisingMigrationPresent: rows.length ? Object.hasOwn(rows[0], 'is_featured') : null };
    }
  });
  await livePage.goto(base);
  await livePage.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => undefined);
  for (let position = 0; position < await livePage.locator('body').evaluate(el => el.scrollHeight); position += 600) {
    await livePage.evaluate(y => window.scrollTo(0, y), position);
  }
  const missingImages = await livePage.evaluate(async () => {
    await Promise.all([...document.images].map(image => image.decode().catch(() => undefined)));
    return [...document.images].filter(image => !image.naturalWidth).map(image => image.alt);
  });
  await livePage.evaluate(() => window.scrollTo(0, 0));
  await livePage.screenshot({ path: `${output}/homepage-live.png`, fullPage: true });
  console.log('LIVE read-only checks:', JSON.stringify({ status, catalogueSummary, missingImages, runtimeErrors: liveErrors }));
  await live.close();
} finally {
  await browser.close();
}
