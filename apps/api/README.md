# 1Fi Marketplace

A React Native application built for the 1Fi SDE internship assignment. It extends the Shop experience with a marketplace where users can browse products, select variants, compare no-cost EMI plans, and review their selection.

Product data and EMI plans are fetched from a Node.js API rather than embedded in UI components.

## Features

- Shop interface with Top Brands, Nearby Stores, and 1Fi Marketplace tabs.
- Responsive banner and product grid.
- Product search and category filters.
- Product details with selectable variants and updated pricing.
- Disabled selection for unavailable variants.
- Dynamically fetched EMI plans.
- Server-side validation of product, variant, and EMI selections.
- Review screen showing the selected product and payment breakdown.
- Loading indicators, empty states, request timeouts, and retry controls.
- Android hardware back navigation.
- Browser support through React Native Web.

Top Brands and Nearby Stores are intentionally blank. Other bottom navigation destinations are visual placeholders.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | JavaScript |
| Frontend | React Native, React |
| Development tooling | Expo |
| Browser support | React Native Web |
| Styling | React Native StyleSheet |
| State management | React hooks and a selection reducer |
| Backend | Node.js built-in HTTP server |
| Data source | JSON files read by the API |
| API communication | Fetch API |
| Testing | Node.js built-in test runner |

No database, API keys, or paid services are required to run the demo.


## Prerequisites

- Node.js 22.13.0 or newer.
- npm.
- Expo Go compatible with the project's Expo SDK for physical-device testing, or a compatible development build.
- A browser for the web preview.

The project currently declares Expo SDK 57. See `apps/mobile/package.json` for dependency versions.

## Local Setup

Open the project root in VS Code. Run all commands below from the folder containing the root `package.json`.

### 1. Install dependencies

```bash
npm run setup
```

The API uses built-in Node.js modules and requires no separate dependency installation.

### 2. Configure the API address

Create `apps/mobile/.env` with the appropriate address for your device.

For a browser running on your computer:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

For an Android emulator:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

For a physical phone, use your computer's local IPv4 address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:4000
```

Replace `192.168.1.25` with your actual address. On Windows, run:

```powershell
ipconfig
```

Use the IPv4 address of the active Wi-Fi adapter. Connect the phone and computer to the same network.

`localhost` on a phone refers to the phone itself, so it cannot point to the API running on your computer.

### 3. Start the API

In the first terminal:

```bash
npm run api
```

The API runs on port `4000` by default.

Open `http://localhost:4000/health` on your computer. The expected response is:

```json
{
  "status": "ok",
  "demo": true
}
```

Keep this terminal running.

### 4. Start the frontend

In a second terminal:

```bash
npm start
```

Scan the QR code with Expo Go to open the app on your phone.

For a browser preview, run:

```bash
npm run web
```

For a running Android emulator:

```bash
npm run android
```

Keep both the API and frontend terminals running during development.

After changing `.env`, restart Expo. To also clear its cache:

```bash
npm --prefix apps/mobile run start -- --clear
```

## Using the Application

1. Open the 1Fi Marketplace tab.
2. Browse products or use search and category filters.
3. Select a product.
4. Choose an available variant.
5. Open the EMI options.
6. Select an eligible EMI plan.
7. Proceed to review the product, variant, and payment breakdown.

Changing the variant clears the previous EMI selection. Selecting a different product resets the previous product's selections.

The final screen is a demo review. It does not create an order, payment, or loan.

## Dynamic Product Data

The API reads these files on each request:

- `apps/api/data/products.json`
- `apps/api/data/plans.json`

Update these files to change products, prices, availability, or EMI rules. Trigger a new request by searching again or reopening a product to see the updated data.

The frontend does not contain hardcoded catalog entries or EMI terms. The application does not automatically poll for changes.

The catalog contains real product models, including Apple iPhone 16, MacBook Air, Sony WH-1000XM5, Apple Watch SE, JBL Flip 6, and iPad.

Prices, reference prices, availability, and financing terms are illustrative demo data. They are not live retailer prices or actual 1Fi offers.

## EMI Implementation

EMI options are calculated by the API for the selected product variant.

- Available tenures come from `plans.json`.
- Plans are filtered using their minimum eligible purchase amount.
- Amounts are stored and calculated in integer paise.
- Demo plans have zero interest, processing fees, and down payment.
- The final instalment includes any rounding remainder.
- The API validates the selected IDs and calculates the review totals independently of client-supplied prices.

Calculation:

```text
regular instalment = floor(price in paise / number of months)

final instalment =
  price in paise - regular instalment × (number of months - 1)
```

This ensures that the instalments add up exactly to the product price.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Check API availability |
| GET | `/api/products` | Retrieve products and categories |
| GET | `/api/products?q=sony&category=Audio` | Search and filter products |
| GET | `/api/products/:id` | Retrieve product details and variants |
| GET | `/api/products/:id/emi-plans?variantId=...` | Retrieve eligible EMI plans |
| POST | `/api/orders/preview` | Validate a selection and return a demo review |
| GET | `/assets/:name.png` | Serve product images |

Example request body for `/api/orders/preview`:

```json
{
  "productId": "iphone-sixteen",
  "variantId": "iphone-pink-128",
  "planId": "emi-6"
}
```

## Testing

Run automated tests:

```bash
npm test
```

Check backend syntax:

```bash
npm run check
```

Generate Android, iOS, and web exports:

```bash
npm --prefix apps/mobile run export
```

The automated tests cover API responses, selection resets, connection handling, unavailable variants, invalid selections, and EMI total reconciliation.

An export verifies bundling; device testing is still needed to check appearance and interactions.

### Manual Checks

- Verify the banner and tabs fit the screen.
- Search for a product and filter by category.
- Search for an unknown product and check the empty state.
- Change variants and confirm the displayed price updates.
- Confirm unavailable variants cannot be selected.
- Select an EMI plan and verify the review totals.
- Change the variant and confirm the old EMI selection is cleared.
- Stop the API, trigger a request, and check error recovery using Retry.
- Test Android back navigation and browser layout.

## Troubleshooting

### API request timed out

- Confirm `npm run api` is still running.
- Check the address in `apps/mobile/.env`.
- On a phone, open `http://YOUR_COMPUTER_IP:4000/health` in its browser.
- Ensure the phone and computer are on the same network.
- Allow Node.js through Windows Firewall on your private network.
- Restart Expo after updating `.env`.

The development connection panel can test a different API address. Changes made there last for the current session; use `.env` for a persistent setting.

### Cannot connect to Expo CLI

This warning concerns the frontend development server, which is separate from the API.

Keep Expo running, check network connectivity, and scan the current QR code after restarting it. An Expo tunnel does not automatically expose the separate API.

### Port 4000 is already in use

If the correct API is already running, use that instance. Otherwise, start the API on a different port.

In PowerShell:

```powershell
$env:PORT="4001"
npm run api
```

Update `EXPO_PUBLIC_API_URL` to use port `4001`, then restart Expo.

### npm audit reports no lockfile at the root

The mobile dependencies and lockfile are inside `apps/mobile`. Run:

```bash
npm --prefix apps/mobile audit
```

Review dependency changes before applying fixes. Avoid `npm audit fix --force`, which can introduce incompatible versions.

## Scope and Limitations

This is a standalone assignment implementation based on the supplied Shop reference. It does not connect to 1Fi's internal systems.

- No authentication, KYC, mutual-fund pledging, or payment processing.
- No real order creation or financing.
- No cart, wishlist, or unrelated application screens.
- Selections are stored in memory and reset when the app restarts.
- The backend is a local demo service with JSON storage and permissive CORS.
- No standalone APK is included.
- Browser support uses the same React Native codebase; this is not a Next.js project.

## Assets and Attribution

The Shop banner was supplied as reference artwork. Product images and specifications use manufacturer or retailer sources documented in [PRODUCT-SOURCES.md](PRODUCT-SOURCES.md).

Third-party names, logos, and images belong to their respective owners. Their inclusion does not imply affiliation or endorsement.