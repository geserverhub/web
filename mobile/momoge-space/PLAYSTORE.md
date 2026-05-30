# Momoge space — Google Play Store

Android app wraps the live **Customer Dashboard** (`/customer-dashboard-login`) in a Capacitor WebView. UI updates ship from the server; Play Store updates are only needed for native shell changes.

## Prerequisites

1. **Public HTTPS URL** for GEserverhub (Play Store requires HTTPS, not `http://127.0.0.1:3005`).
2. [Android Studio](https://developer.android.com/studio) + JDK 17.
3. [Google Play Console](https://play.google.com/console) developer account ($25 one-time).

## 1. Configure server URL

```bash
cd mobile/momoge-space
cp .env.example .env
# Edit .env — set CAPACITOR_SERVER_URL to your production host, e.g.:
# CAPACITOR_SERVER_URL=https://your-domain.com
```

Load env on Windows PowerShell before sync:

```powershell
$env:CAPACITOR_SERVER_URL="https://your-domain.com"
npm install
npx cap add android
npm run cap:sync
```

## 2. Open in Android Studio

```bash
npm run cap:open
```

- Run on device/emulator to test login + dashboard.
- App must reach your server over **HTTPS** with valid certificate.

## 3. Create release keystore (once)

```bash
keytool -genkey -v -keystore momoge-space-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias momogespace
```

Store the `.jks` file safely. Set paths in `.env` (never commit the keystore or passwords).

## 4. Build AAB for Play Store

In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (AAB)**.

Or CLI (after setting keystore env vars):

```bash
npm run android:release
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Play Console checklist

| Item | Value |
|------|--------|
| App name | Momoge space |
| Package | `com.geserverhub.momogespace` |
| Category | Business / Productivity |
| Privacy policy URL | Required — host a page describing data collected (energy usage, login email) |
| Screenshots | Phone — login + dashboard tabs |
| Icon | 512×512 PNG (`public/momoge/Logo-brand.png`) |

Upload the **AAB** to **Production** or **Internal testing** first.

## 6. After server deploy

When you push new web code to GEserverhub, users get updates **without** a new Play Store release (WebView loads your server).

Run `npm run cap:sync` only when changing app id, icons, splash, or native plugins.

## Troubleshooting

- **Blank screen** — check `CAPACITOR_SERVER_URL`, HTTPS, and that `/customer-dashboard-login` loads in Chrome on the phone.
- **401 on API** — user must log in again after JWT auth deploy (`git pull` + re-login).
- **Cleartext error** — use HTTPS in production; `cleartext` is only for local dev.
