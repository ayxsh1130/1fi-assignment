# Apply the phone fixes

1. Stop Expo with Ctrl+C. Keep your working API running.
2. Extract this archive somewhere separate. Copy the **contents inside** its `1fi-marketplace` folder into `D:\1fi`, replacing matching source files. Keep your existing `.env` and `node_modules`; those are excluded from the archive. The included mobile lockfile matches the verified bundle.
3. From `D:\1fi`, run:

```powershell
npm run setup
npm start -- --clear
```

Setup installs the newly declared `expo-constants` and `react-native-safe-area-context` dependencies. Scan the new QR code.

## What changed

- Banner width and height now follow the measured app container. The full image stays proportional on phones and tablets. The Shop tabs overlap the banner by 27 points and explicitly render above it.
- Replaced React Native's deprecated SafeAreaView with the supported safe-area-context provider/view; removed the fixed Android padding.
- The request hook no longer leaks an internal `key` into JSX props. Warning messages are fixed at the source, not hidden.
- Without a `.env` override, the API host is inferred from Expo's LAN host and uses port 4000. The Android emulator-only address is no longer the default on a phone connected through LAN Expo.
- When requests fail in development, the error screen shows the current API URL and a **Test & connect** control. Paste the exact working `/health` URL from your phone, including port 4001 if applicable. The app strips `/health`, checks `/api/products`, and reloads from the new host. Product images use the same host.
- Connection changes made in that panel last for the current app session. Put the confirmed base URL in `apps/mobile/.env` to keep it after a full reload. A valid `.env` setting takes precedence over automatic detection.

Six demo products remain served dynamically from the API, with their variants and EMI plans. There is no hardcoded product fallback in the screens.

## Verification

All 16 tests passed. The suite exercises the exact mobile request helper against the running API, including products → plans → review, plus LAN-host selection, port overrides, invalid responses and timeouts. All eight mobile modules passed JSX syntax checks. Expo successfully exported Android, iOS and web bundles after dependency installation. Native rendering still needs confirmation on the phone; the preview browser blocked the local URL and no native device was available here.

The safe-area and host configuration changes follow the official [safe-area-context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/) and [Expo Constants](https://docs.expo.dev/versions/latest/sdk/constants/) APIs.
