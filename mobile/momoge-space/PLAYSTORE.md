# Momoge space — Google Play Store

Android app wraps the live **Customer Dashboard** (`/customer-dashboard-login`) in a Capacitor WebView. UI updates ship from the server; Play Store updates are only needed for native shell changes.

## Prerequisites

1. **Public HTTPS URL** for GEserverhub — default hub: `https://strong-dory-enabled.ngrok-free.app` (ngrok → GE-SERVER :3005).
2. [Android Studio](https://developer.android.com/studio) + JDK 17.
3. [Google Play Console](https://play.google.com/console) developer account ($25 one-time).

## 1. Configure server URL

```bash
cd mobile/momoge-space
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

- Run on device/emulator to test login + dashboard.
- App must reach your server over **HTTPS** with valid certificate.

## 3. Create release keystore (once)

```bash
keytool -genkey -v -keystore momoge-space-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias momogespace
```

Store the `.jks` file safely. Set paths in `.env` (never commit the keystore or passwords).

## 4. Build AAB for Play Store

In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (AAB)**.

Or CLI (after `android/keystore.properties` exists — see step 3):

```powershell
cd mobile/momoge-space/android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Play Console checklist

| Item | Value |
|------|--------|
| App name | Momoge space |
| Package | `com.momogespace.myapp` |
| Category | Business / Productivity |
| Privacy policy URL | `https://www.ge-serverhub.com/policy` |
| Screenshots | Phone — login + dashboard tabs |
| Icon | 512×512 PNG (`public/momoge/Logo-brand.png`) |

Upload the **AAB** to **Production** or **Internal testing** first.

## 6. After server deploy

When you push new web code to GEserverhub, users get updates **without** a new Play Store release (WebView loads your server).

Run `npm run cap:sync` only when changing app id, icons, splash, or native plugins.

## Upload key lost / wrong signing key

Play expects upload certificate **SHA-1:** `23:5A:07:4D:97:99:43:14:5C:13:12:CA:D6:89:8A:D9:04:11:DB:27` (registered upload key for `com.momogespace.myapp`).

Older keys (do **not** upload with these unless Play asks for them):

| SHA-1 | Notes |
|-------|--------|
| `56:5D:E6:C8:...:58:C6` | First local keystore (`Ms22010567!Go`) |
| `FC:CD:67:6C:...:62:63` | Current `momoge-space-release.jks` (`MomogeHub2026!`) — wrong until upload key reset is approved |

**Option A — restore backup (best)**  
Copy the original `momoge-space-release.jks` back to `mobile/momoge-space/`, set `android/keystore.properties`, then `gradlew bundleRelease`.

**Option B — request upload key reset (if backup is gone)**  

1. Play Console → **Momoge space** → **Setup** → **App integrity**  
2. **Request upload key reset** (or “Upload new key”)  
3. Download from that page:
   - `pepk.jar`
   - `encryption_public_key.pem` (Google’s public key — not your upload cert)
4. Export encrypted private key (run from `mobile/momoge-space`):

```powershell
$java = "C:\Program Files\Android\Android Studio\jbr\bin\java.exe"
& $java -jar pepk.jar `
  --keystore=momoge-space-release.jks `
  --alias=momogespace `
  --output=encrypted_private_key.zip `
  --keystore-pass=pass:YOUR_STORE_PASSWORD `
  --key-pass=pass:YOUR_KEY_PASSWORD `
  --rsa-aes-encryption `
  --encryption-key-path=encryption_public_key.pem `
  --include-cert
```

5. Upload to Play Console:
   - `encrypted_private_key.zip` (from pepk)
   - `upload_certificate.pem` (public cert only — regenerate below if missing)
6. Wait for Google approval (usually 1–2 days)  
7. Sign releases with the **same** `momoge-space-release.jks` in `keystore.properties` → `gradlew bundleRelease` → upload AAB  

Regenerate `upload_certificate.pem`:

```powershell
$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
& $keytool -export -rfc -alias momogespace -file upload_certificate.pem `
  -keystore momoge-space-release.jks -storepass "YOUR_STORE_PASSWORD"
```

After reset is approved, Play will expect upload key SHA-1 **`FC:CD:67:6C:...`** (current keystore), not `23:5A:07:...`.

### Play Console: “Export and upload a key from Java keystore”

| Upload in this step | Do **not** upload here |
|---------------------|-------------------------|
| `encrypted_private_key.zip` (from pepk) | `app-release.aab` |
| `upload_certificate.pem` | |

Quick run (after `pepk.jar` + `encryption_public_key.pem` are in `mobile/momoge-space/`):

```powershell
cd mobile/momoge-space
$env:MOMOGE_KEYSTORE_PASSWORD = "YOUR_PASSWORD"
.\scripts\export-upload-key.ps1
```

Or create a **new** upload key first (optional in Play Console) — then point pepk at that new `.jks` instead.

Verify any `.jks` file:

```powershell
keytool -list -v -keystore momoge-space-release.jks -alias momogespace
```

SHA-1 must match Play Console before uploading.

## Troubleshooting

- **Blank screen** — check `CAPACITOR_SERVER_URL`, HTTPS, and that `/customer-dashboard-login` loads in Chrome on the phone.
- **401 on API** — user must log in again after JWT auth deploy (`git pull` + re-login).
- **Cleartext error** — use HTTPS in production; `cleartext` is only for local dev.
