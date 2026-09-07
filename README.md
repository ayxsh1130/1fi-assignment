# 1Fi Marketplace

A standalone implementation of the 1Fi Shop assignment: browse products, choose a variant, select a no-cost EMI plan, and review the selection. The Shop layout follows the supplied app screenshot and uses the supplied banner asset.

## Run locally

Install **Node.js 22.13 or newer** and npm. No API keys, paid services, ChatGPT login, database or Docker are needed.

From this folder, install the mobile app dependencies once:

```sh
npm run setup
```

In terminal 1, start the API (it has no third-party dependencies):

```sh
npm run api
```

Check `http://localhost:4000/health` in your browser. It should return `{"status":"ok","demo":true}`.

In terminal 2, start Expo:

```sh
npm start
```

Press **a** for a running Android emulator, **i** for the iOS simulator on macOS, or **w** for a browser preview. You can also run `npm run web` directly. Browser preview is provided by the same React Native app; this is not a separate website.

### Use a physical phone

1. Install an Expo Go version compatible with the project's SDK (57), or use a compatible development build.
2. Put your phone and computer on the same Wi-Fi network.
3. Run `ipconfig` in Windows and find the Wi-Fi adapter's IPv4 address, e.g. `192.168.1.25`.
4. Create `apps/mobile/.env` using `.env.example` and set `EXPO_PUBLIC_API_URL=http://192.168.1.25:4000`, replacing the address with your computer's actual IP.
5. Allow Node.js on your private network if Windows Firewall asks. The phone must be able to open `http://YOUR_IP:4000/health` in its browser.
6. Restart Expo after editing `.env`, then scan its QR code.

Never use `localhost` for the API on a physical phone: that points to the phone itself. Without an override, the app infers your computer's LAN address from Expo and uses port 4000. If no usable LAN host is available, it falls back to `10.0.2.2` for Android or `localhost` for iOS/web. A Metro tunnel does not expose the separate API. On a development request error, use **Test & connect** to paste and verify your working API URL, including a changed port. This checks the catalog endpoint, not just health. Session changes can be saved permanently in `.env`.

If Expo reports SDK dependency mismatches, run `npx expo install --fix` from **apps/mobile**. The dependency matrix comes from [Expo SDK reference](https://docs.expo.dev/versions/latest/). An APK is not bundled; this is a source-code submission. Standalone native binaries require the usual Android/iOS build tools and local-development HTTP configuration.

## Implemented flow

- Shop banner, three selectable Shop tabs, and the reference bottom navigation appearance.
- Top Brands and Nearby Stores have blank bodies, as explicitly permitted by the brief.
- Marketplace defaults open so a reviewer can immediately access the implemented feature.
- API-driven product search, category filtering, product details and variants.
- API-served product images with an image-failure fallback.
- Out-of-stock variants cannot be selected.
- EMI plans are fetched for the selected variant. No plan is selected without user action.
- The API computes instalments in integer paise. The final instalment absorbs rounding so every schedule reconciles exactly to its total.
- Changing a variant clears the previous plan; navigating back preserves current selections. Choosing another product resets them.
- The Proceed action posts selection IDs to the API for validation and an authoritative review. It creates no order, payment or loan.
- Loading, empty search results, retryable errors, request cancellation and a 10-second timeout.
- Small-phone single-column layout, normal-phone two-column layout and wider three-column layout.
- Android hardware back support and labelled interactive controls.

The other bottom navigation destinations are visual context only, not implemented destinations. Product selections are in-memory and intentionally reset when the app is restarted.

## Data is dynamic

UI components contain **no catalog entries or EMI terms**. `apps/api/data/products.json` holds real product models and demo-priced variants; `plans.json` holds illustrative tenure rules. The API reads these on each request. Change a value, then search again or reopen the product to see it without rebuilding the mobile app. There is no automatic polling or admin editor.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | API reachability |
| `GET /api/products?q=&category=` | Search/filter catalog and return categories |
| `GET /api/products/:id` | Product and variant details |
| `GET /api/products/:id/emi-plans?variantId=...` | Applicable plans, product and variant summary |
| `POST /api/orders/preview` | Validate selection and return a demo review |
| `GET /assets/:name.png` | Bundled illustrations |

Example preview body:

```json
{"productId":"iphone-sixteen","variantId":"iphone-pink-128","planId":"emi-6"}
```

All amounts use integer **paise**, not floating-point rupees. The API rejects invalid or unavailable variants, mismatched product/variant combinations and ineligible plans. Client-supplied prices are ignored. CORS is open only because this is a public local demo without accounts or private data; it is not a production backend.

## Structure and choices

```text
apps/mobile/App.js           Screen flow and selection state
apps/mobile/src/Shop.js      Shop tabs, search, categories, product cards
apps/mobile/src/Checkout.js  Product details, plans, review
apps/mobile/src/ui.js        Shared controls and visual tokens
apps/mobile/src/api.js       Fetch lifecycle, timeout, retry, formatting
apps/mobile/src/selection.mjs Selection reducer
apps/api/server.mjs          HTTP routing and request validation
apps/api/catalog.mjs         Catalog lookup and EMI calculations
apps/api/data/               Replaceable mock data
apps/api/assets/             Product PNGs and unused prototype SVG illustrations
tests/                      API integration and selection regression tests
tools/generate-art.mjs       Optional illustration regeneration utility
```

React Native + Expo provides the mobile implementation. Plain React state and a small reducer are sufficient for four screens. The demo API uses Node's HTTP server so it runs immediately without dependency installation. A production API can replace it behind the same request/response contract. The optional artwork tool requires `sharp` only when regenerating the already-bundled images.

## Assignment assumptions

No starter repository, internal stack information or promised Marketplace reference material was supplied. This is therefore a standalone implementation based on the supplied Shop screenshot, not a modification of 1Fi's internal application. Fonts and custom navigation icons are approximations. No assumption of access to 1Fi's private APIs is made.

Product models, brands and specifications refer to real products; prices, reference prices, stock and EMI terms are **simulated**, not actual 1Fi offers. Product imagery is bundled from attributed manufacturer/retailer sources; see PRODUCT-SOURCES.md. The supplied banner is retained as reference artwork and does not imply that this prototype performs financing. No ownership of third-party artwork is claimed.

Authentication, KYC, mutual-fund pledging, payments, orders, cart, wishlist and unrelated app screens are outside the brief and are not implemented.

## Verification

From the repository root:

```sh
npm test
npm run check
```

The connection-fix release passed all 16 automated tests, covering the live HTTP API and mobile request/selection handling. For this catalogue update, both selection tests and an offline check of all six products, local images, available variants and EMI previews passed. Android, iOS and web exports also succeeded. The full HTTP suite was not rerun because its launch was blocked in this session; run `npm test` locally before submission.

**Build verification:** dependencies installed and `expo export --platform all` succeeded for Android, iOS and web. The generated mobile lockfile is included. The preview browser blocked the local URL, and no native device was available here, so on-device visual verification remains outstanding. Complete the checklist below before submitting. See `UPDATE.md` for applying the phone fixes.

### Manual acceptance checklist

- [ ] Launch the app on your target device. Check banner, safe areas and all three Shop tabs.
- [ ] Open Marketplace, search for `Sony`, filter to Audio and clear the search.
- [ ] Search for an unknown word; check the empty state and Clear filters.
- [ ] Open Apple iPhone 16 and change 128 GB to 256 GB; verify price updates. Teal is disabled.
- [ ] Open EMI plans, choose six months and continue; verify product, variant and total on review.
- [ ] Go back to variant selection and change variant; ensure no previous EMI plan remains selected.
- [ ] Use Android hardware back; check screen order and preserved selections.
- [ ] Stop the API and trigger a request. Restart it and use Retry to recover.
- [ ] Check a 320px-wide screen, a normal phone and a wider screen. Check larger text settings.
- [ ] Confirm there are no runtime warnings or clipped controls before recording a demo.

For deterministic loading/error testing, restart the API with `DEMO_LATENCY_MS=1000` or `DEMO_FAIL=1`. These are server environment variables, disabled by default. In Windows PowerShell, use `$env:DEMO_FAIL="1"` before `npm run api`; remove it with `Remove-Item Env:DEMO_FAIL` and restart to recover. Never leave failure mode enabled for submission.

## GitHub handoff

Upload this folder's source files, README and generated mobile lockfile to your chosen GitHub repository. Exclude `.env`, `node_modules` and `.expo`. Add real screenshots or a short screen recording after running it on your device. No external repository has been created or modified by this package.
