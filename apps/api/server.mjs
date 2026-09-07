import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ApiError, catalog, getProduct, getVariant, getPlans, previewOrder } from './catalog.mjs';

const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(data));
};
async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 16384) throw new ApiError(413, 'Request body too large.');
  }
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch { throw new ApiError(400, 'A valid JSON object is required.'); }
}

export function makeServer() {
  return createServer(async (req, res) => {
    // Public local demo catalog; no credentials, accounts or private data.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/health' && req.method === 'GET') return send(res, 200, { status:'ok', demo:true });
      if (url.pathname.startsWith('/assets/') && req.method === 'GET') {
        const name = url.pathname.slice('/assets/'.length);
        if (!/^[a-z-]+\.png$/.test(name)) throw new ApiError(404, 'Image not found.');
        let file;
        try { file = await readFile(new URL(`./assets/${name}`, import.meta.url)); }
        catch { throw new ApiError(404, 'Image not found.'); }
        res.writeHead(200, { 'Content-Type':'image/png', 'Cache-Control':'public, max-age=3600' });
        return res.end(file);
      }
      const delay = Math.min(5000, Math.max(0, Number(process.env.DEMO_LATENCY_MS) || 0));
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      if (process.env.DEMO_FAIL === '1') throw new ApiError(503, 'Demo service temporarily unavailable. Please retry.');
      if (req.method === 'GET' && url.pathname === '/api/products') {
        const all = await catalog();
        const q = (url.searchParams.get('q') || '').trim().toLowerCase();
        const category = url.searchParams.get('category');
        const items = all.filter(p => (!category || p.category === category) && `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q));
        return send(res, 200, { items, categories:[...new Set(all.map(p => p.category))], demo:true });
      }
      const match = url.pathname.match(/^\/api\/products\/([a-z0-9-]+)(\/emi-plans)?$/);
      if (req.method === 'GET' && match) {
        if (match[2]) {
          const product = await getProduct(match[1]);
          const variant = getVariant(product, url.searchParams.get('variantId'));
          return send(res, 200, { items:await getPlans(product.id, variant.id), product:{ id:product.id, name:product.name }, variant, demo:true });
        }
        return send(res, 200, { product:await getProduct(match[1]), demo:true });
      }
      if (req.method === 'POST' && url.pathname === '/api/orders/preview') return send(res, 200, await previewOrder(await body(req)));
      throw new ApiError(404, 'Endpoint not found.');
    } catch (error) {
      if (!(error instanceof ApiError)) console.error(error);
      send(res, error.status || 500, { error:error instanceof ApiError ? error.message : 'Something went wrong. Please retry.' });
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 4000;
  makeServer().listen(port, '0.0.0.0', () => console.log(`1Fi demo API listening on http://localhost:${port}`));
}
