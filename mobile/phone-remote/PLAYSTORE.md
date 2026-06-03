# Phone Remote — Google Play Store

Android app wraps the live **Phone Remote** web UI (`/phone-remote?mobileApp=1`) in a Capacitor WebView. Includes native **Accessibility** control so a Viewer can tap/type on the host phone screen while sharing.

## Prerequisites

1. **Public HTTPS URL** for GEserverhub — default hub: `https://strong-dory-enabled.ngrok-free.app`
2. [Android Studio](https://developer.android.com/studio) + JDK 17
3. [Google Play Console](https://play.google.com/console) developer account

## 1. Configure and sync

```bash
cd mobile/phone-remote
npm install
npm run cap:sync
```

Override server URL:

```powershell
$env:CAPACITOR_SERVER_URL="https://your-hub.example.com"
npm run cap:sync
```

## 2. Open in Android Studio

```bash
npm run cap:open
```

On the host phone: open **Phone Remote** app → Host → start share → enable **Accessibility** when prompted.

## 3. Release keystore (once)

```bash
keytool -genkey -v -keystore phone-remote-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias phoneremote
```

Copy `.env.example` to `.env` and set `ANDROID_KEYSTORE_*` paths, then:

```bash
npm run android:release
```

AAB output: `android/app/build/outputs/bundle/release/app-release.aab`

## Package

- **Application ID:** `phoneremote.myapp`
- **Display name:** Phone Remote
