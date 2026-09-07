import test from 'node:test';
import assert from 'node:assert/strict';
import { initialSelection, selectionReducer as reduce } from '../apps/mobile/src/selection.mjs';
test('changing a variant invalidates the previously selected EMI plan', () => {
  const previous = { productId:'iphone-sixteen', variantId:'iphone-pink-128', planId:'emi-6' };
  assert.deepEqual(reduce(previous, { type:'variant', id:'iphone-black-256' }), { productId:'iphone-sixteen', variantId:'iphone-black-256', planId:null });
});
test('returning to the same product keeps selections; another product resets them', () => {
  const previous = { productId:'iphone-sixteen', variantId:'iphone-pink-128', planId:'emi-6' };
  assert.equal(reduce(previous, { type:'product', id:'iphone-sixteen' }), previous);
  assert.deepEqual(reduce(previous, { type:'product', id:'jbl-flip-six' }), { productId:'jbl-flip-six', variantId:null, planId:null });
  assert.deepEqual(reduce(previous, { type:'reset' }), initialSelection);
});
