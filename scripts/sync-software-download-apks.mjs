#!/usr/bin/env node
/**
 * Copy debug/release APKs from Capacitor Android builds into storage/software-downloads/.
 * Run after: cd mobile/<app> && npx cap sync android && cd android && ./gradlew assembleDebug
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const storageRoot = path.join(root, "storage", "software-downloads");

const SOURCES = [
  {
    slug: "phone-remote",
    out: "phone-remote/PhoneRemote-android.apk",
    candidates: [
      "mobile/phone-remote/android/app/build/outputs/apk/debug/app-debug.apk",
      "mobile/phone-remote/android/app/build/outputs/apk/release/app-release.apk",
    ],
  },
  {
    slug: "momoge-space",
    out: "momoge-space/MomogeSpace-android.apk",
    candidates: [
      "mobile/momoge-space/android/app/build/outputs/apk/debug/app-debug.apk",
      "mobile/momoge-space/android/app/build/outputs/apk/release/app-release.apk",
    ],
  },
  {
    slug: "cargo",
    out: "cargo/CargoThaiKorea-android.apk",
    candidates: [
      "mobile/cargo/android/app/build/outputs/apk/debug/app-debug.apk",
      "mobile/cargo/android/app/build/outputs/apk/release/app-release.apk",
    ],
  },
];

let copied = 0;
let missing = 0;

for (const { slug, out, candidates } of SOURCES) {
  const dest = path.join(storageRoot, out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const src = candidates.map((c) => path.join(root, c)).find((p) => fs.existsSync(p));
  if (!src) {
    console.warn(`[skip] ${slug}: no APK found (build ${slug} first)`);
    missing += 1;
    continue;
  }
  fs.copyFileSync(src, dest);
  const stat = fs.statSync(dest);
  console.log(`[ok] ${out} ← ${path.relative(root, src)} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  copied += 1;
}

console.log(`\nDone: ${copied} copied, ${missing} missing.`);
if (missing > 0) {
  console.log("Build example: cd mobile/phone-remote/android && ./gradlew assembleDebug");
  process.exitCode = 1;
}
