import { readFile } from 'node:fs/promises';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Read on each request so edits to demo JSON appear without rebuilding the app.
export async function catalog() {
  return JSON.parse(await readFile(new URL('./data/products.json', import.meta.url), 'utf8'));
}
export async function getProduct(id) {
  const product = (await catalog()).find(p => p.id === id);
  if (!product) throw new ApiError(404, 'Product not found. Return to Marketplace and try another product.');
  return product;
}
export function getVariant(product, id) {
  const variant = product.variants.find(v => v.id === id);
  if (!variant) throw new ApiError(400, 'Choose a valid product variant.');
  if (!variant.inStock) throw new ApiError(409, 'This variant is currently unavailable. Please choose another.');
  return variant;
}
export async function getPlans(productId, variantId) {
  const product = await getProduct(productId);
  const variant = getVariant(product, variantId);
  const terms = JSON.parse(await readFile(new URL('./data/plans.json', import.meta.url), 'utf8'));
  return terms.filter(p => variant.pricePaise >= p.minPricePaise).map(p => {
    const monthlyPaise = Math.floor(variant.pricePaise / p.months);
    return { id:p.id, months:p.months, recommended:p.recommended, monthlyPaise,
      finalPaymentPaise:variant.pricePaise - monthlyPaise * (p.months - 1),
      totalPaise:variant.pricePaise, interestPaise:0, feePaise:0, downPaymentPaise:0 };
  });
}
export async function previewOrder({ productId, variantId, planId }) {
  if (![productId, variantId, planId].every(x => typeof x === 'string' && x.length > 0)) {
    throw new ApiError(400, 'Product, variant and EMI plan are required.');
  }
  const product = await getProduct(productId);
  const variant = getVariant(product, variantId);
  const plan = (await getPlans(productId, variantId)).find(p => p.id === planId);
  if (!plan) throw new ApiError(400, 'That EMI plan is not available for this variant.');
  // Prices are always resolved on the server. Client-supplied totals are ignored.
  return { demo:true, product:{ id:product.id, name:product.name, image:product.image }, variant, plan,
    message:'Demo review only. No purchase, payment or loan has been created.' };
}
