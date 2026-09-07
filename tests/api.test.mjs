import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeServer } from '../apps/api/server.mjs';
import { catalog, getPlans } from '../apps/api/catalog.mjs';
let server, base;
before(async () => {
  server = makeServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const get = path => fetch(`${base}${path}`);
const post = data => fetch(`${base}/api/orders/preview`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(data) });

test('catalog search combines case-insensitive query and category', async () => {
  const response = await get('/api/products?q=SONY&category=Audio');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.items.length, 1);
  assert.ok(data.items.every(p => p.brand === 'Sony' && p.category === 'Audio'));
  assert.ok(data.categories.includes('Phones'));
  assert.equal((await (await get('/api/products?q=not-a-product')).json()).items.length, 0);
});
test('all advertised product images are served locally', async () => {
  for (const product of await catalog()) {
    const response = await get(`/assets/${product.image}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.ok((await response.arrayBuffer()).byteLength > 1000);
  }
});
test('every plan reconciles exactly to the variant price in paise', async () => {
  for (const product of await catalog()) for (const variant of product.variants.filter(v => v.inStock)) {
    const plans = await getPlans(product.id, variant.id);
    assert.ok(plans.length);
    for (const plan of plans) {
      assert.equal(plan.monthlyPaise * (plan.months - 1) + plan.finalPaymentPaise, variant.pricePaise);
      assert.equal(plan.totalPaise, variant.pricePaise);
      assert.ok(Number.isInteger(plan.finalPaymentPaise));
      assert.ok(plan.finalPaymentPaise >= plan.monthlyPaise);
    }
  }
});
test('changing variant returns its applicable price and plans', async () => {
  const a = await getPlans('iphone-sixteen', 'iphone-pink-128');
  const b = await getPlans('iphone-sixteen', 'iphone-black-256');
  assert.notEqual(a[0].totalPaise, b[0].totalPaise);
  assert.equal(a[0].totalPaise, 6490000);
  assert.equal(b[0].totalPaise, 7490000);
});
test('review ignores a client supplied price and clearly remains a demo', async () => {
  const response = await post({ productId:'iphone-sixteen', variantId:'iphone-pink-128', planId:'emi-6', totalPaise:1 });
  assert.equal(response.status, 200);
  const review = await response.json();
  assert.equal(review.plan.totalPaise, 6490000);
  assert.equal(review.demo, true);
  assert.match(review.message, /No purchase/);
});
test('review rejects unavailable, mismatched and ineligible selections', async () => {
  assert.equal((await post({ productId:'iphone-sixteen', variantId:'iphone-teal-256', planId:'emi-6' })).status, 409);
  assert.equal((await post({ productId:'iphone-sixteen', variantId:'jbl-black', planId:'emi-6' })).status, 400);
  assert.equal((await post({ productId:'jbl-flip-six', variantId:'jbl-black', planId:'emi-12' })).status, 400);
  assert.equal((await post({})).status, 400);
  assert.equal((await post(null)).status, 400);
});
test('unknown products and assets return controlled 404 errors', async () => {
  assert.equal((await get('/api/products/missing')).status, 404);
  assert.equal((await get('/assets/missing.png')).status, 404);
  assert.equal((await get('/assets/%2e%2e%2fdata%2fproducts.json')).status, 404);
});
test('malformed request bodies are rejected', async () => {
  const response = await fetch(`${base}/api/orders/preview`, { method:'POST', body:'{broken' });
  assert.equal(response.status, 400);
});
test('local browser preflight succeeds', async () => {
  const response = await fetch(`${base}/api/products`, { method:'OPTIONS' });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
});
