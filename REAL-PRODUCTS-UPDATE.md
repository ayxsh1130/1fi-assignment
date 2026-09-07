# Apply the real-product update

Copy `apps/api/data/products.json` and the six new product PNG files from `apps/api/assets` into the same locations in your existing project. Also replace `apps/mobile/src/Shop.js`, `Checkout.js` and `ui.js` for updated labels. Keep `.env` and your running API address unchanged. Alternatively, copy the archive's project contents over your current project, preserving `.env` and `node_modules`.

No new dependency is introduced by this catalogue update. Restart the API and reload the app from Marketplace. Existing product/variant IDs have changed, so do not remain on an old detail screen across the update. Image filenames are new to avoid showing cached prototype illustrations.

The catalogue now contains iPhone 16, MacBook Air M4, Sony WH-1000XM5, Apple Watch SE (second generation), JBL Flip 6 and iPad A16, with real product imagery and specifications. The API still supplies the data dynamically; screens do not contain product entries. Prices, availability and EMI plans remain labelled demo values. See PRODUCT-SOURCES.md for attribution.

Verification: all catalogue images exist; all available variants and their EMI review totals reconcile; the selection regression tests pass. Expo exports succeed for Android, iOS and web. The full HTTP suite should be rerun locally with `npm test`.
