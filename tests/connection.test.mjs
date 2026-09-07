import test from 'node:test';
import assert from 'node:assert/strict';
import { makeServer } from '../apps/api/server.mjs';
import { normalizeBaseUrl, resolveApiUrl, requestJson } from '../apps/mobile/src/connection.mjs';

test('physical Android uses the Expo LAN host instead of emulator loopback', () => {
  assert.equal(resolveApiUrl({ hostUri:'192.168.1.25:8081', platform:'android' }), 'http://192.168.1.25:4000');
  assert.equal(resolveApiUrl({ hostUri:'exp://192.168.1.25:8081', platform:'ios' }), 'http://192.168.1.25:4000');
  assert.equal(resolveApiUrl({ hostUri:'example.exp.direct:8081', platform:'android' }), 'http://10.0.2.2:4000');
});
test('explicit port override wins and a pasted health URL is normalized', () => {
  assert.equal(resolveApiUrl({ override:' http://192.168.1.25:4001/health ', hostUri:'192.168.1.25:8081', platform:'android' }), 'http://192.168.1.25:4001');
  assert.equal(normalizeBaseUrl('http://192.168.1.25:4000/health'), 'http://192.168.1.25:4000');
  assert.throws(() => normalizeBaseUrl('file:///tmp/products.json'));
});
test('the mobile request helper fetches all six demo products through the real API', async () => {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const data = await requestJson(base, '/api/products');
    assert.equal(data.items.length, 6);
    const product = data.items[0];
    const variant = product.variants.find(v => v.inStock);
    const plans = await requestJson(base, `/api/products/${product.id}/emi-plans?variantId=${variant.id}`);
    const review = await requestJson(base, '/api/orders/preview', { body:JSON.stringify({ productId:product.id, variantId:variant.id, planId:plans.items[0].id }) });
    assert.equal(review.plan.totalPaise, variant.pricePaise);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('a different service at the same address cannot masquerade as the catalog', async () => {
  await assert.rejects(requestJson('http://localhost:4000', '/api/products', { fetchImpl:async () => ({ ok:true, json:async () => ({ status:'ok' }) }) }), /not the Marketplace API/);
});
test('timeouts are actionable and do not leave a loading request running', async () => {
  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
  await assert.rejects(requestJson('http://localhost:4000', '/api/products', { fetchImpl, timeoutMs:20 }), /timed out/);
});
