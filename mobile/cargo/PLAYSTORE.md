# คาโก้ ไทย-เกาหลี — Google Play Store

Android app wraps the live **Cargo portal** (`/cargo/track`) in a Capacitor WebView. UI updates ship from the server; Play Store updates are only needed for native shell changes.

## Prerequisites

1. **Public HTTPS URL** for GEserverhub — default hub: `https://strong-dory-enabled.ngrok-free.app` (ngrok → GE-SERVER :3005).
2. [Android Studio](https://developer.android.com/studio) + JDK 17.
3. [Google Play Console](https://play.google.com/console) developer account ($25 one-time).

## 1. Configure server URL

```bash
cd mobile/cargo
npm install
npm run cap:sync
```

Default server URL is already set in `capacitor.config.ts`. To override:

```powershell
$env:CAPACITOR_SERVER_URL="https://strong-dory-enabled.ngrok-free.app"
npm run cap:sync
```

## 2. Open in Android Studio

```bash
npm run cap:open
```

- Run on device/emulator to test tracking, login, and shipment request.
- App must reach your server over **HTTPS** with valid certificate.

## 3. Create release keystore (once)

```bash
keytool -genkey -v -keystore cargo-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cargothaikorea
```

Store the `.jks` file safely. Set paths in `.env` (never commit the keystore or passwords).

## 4. Build AAB for Play Store

In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (AAB)**.

Or CLI (after `android/keystore.properties` exists — see step 3):

```powershell
cd mobile/cargo/android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Play Console checklist

| Item | Value |
|------|--------|
| App name | Cargo Thai Korea (คาโก้ ไทย-เกาหลี) |
| Package | `com.cargothaikorea.myapp` |
| Category | Business / Travel & Local |
| Privacy policy URL | `https://ge-energytech.com/privacy` |
| Screenshots | Phone — track, request shipment, profile |
| Icon | 512×512 PNG (`public/uploads/logos/cargo.jpg`) |

Upload the **AAB** to **Internal testing** first, then Production.

## 6. After server deploy

When you push new web code to GEserverhub, users get updates **without** a new Play Store release (WebView loads your server).

Run `npm run cap:sync` only when changing app id, icons, splash, or native plugins.

## Troubleshooting

- **Blank screen** — check `CAPACITOR_SERVER_URL`, HTTPS, and that `/cargo/track` loads in Chrome on the phone.
- **Camera upload fails** — grant Camera permission in Android settings; retest parcel photo upload.
- **Cleartext error** — use HTTPS in production; `cleartext` is only for local dev.
