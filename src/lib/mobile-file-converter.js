/** Store upload rules and conversion presets for admin mobile file converter. */

export const ICON_SIZE_PRESETS = {
  android: [48, 72, 96, 144, 192, 512],
  ios: [60, 76, 120, 152, 167, 180, 1024],
};

/** Extensions accepted when uploading to each store (after conversion or release). */
export const STORE_UPLOAD_EXTENSIONS = {
  android: [
    { ext: ".aab", label: "Android App Bundle", usage: "อัปโหลด Release ใน Google Play Console" },
    { ext: ".apk", label: "Android APK", usage: "ทดสอบติดตั้ง / ตรวจ SHA-1 signing certificate" },
    { ext: ".png", label: "PNG icon / screenshot", usage: "ไอคอน 512×512 และภาพหน้าจอ" },
    { ext: ".jpg", label: "JPEG screenshot", usage: "ภาพหน้าจอ Play Store" },
    { ext: ".webp", label: "WebP asset", usage: "ภาพโปรโมต (บางส่วน)" },
    { ext: ".pem", label: "Upload certificate", usage: "ขอ reset upload key" },
    { ext: ".zip", label: "Encrypted upload key", usage: "pepk.jar output สำหรับ Play" },
  ],
  ios: [
    { ext: ".ipa", label: "iOS App Archive", usage: "อัปโหลดผ่าน Transporter / Xcode" },
    { ext: ".png", label: "PNG icon / screenshot", usage: "ไอคอน 1024×1024 และภาพหน้าจอ" },
    { ext: ".jpg", label: "JPEG screenshot", usage: "ภาพหน้าจอ App Store Connect" },
  ],
};

/** Bundle file attached to a conversion job (optional). */
export const BUNDLE_ACCEPT = {
  android: {
    extensions: [".aab", ".apk"],
    mimeTypes: [
      "application/octet-stream",
      "application/vnd.android.package-archive",
      "application/java-archive",
    ],
    maxBytes: 200 * 1024 * 1024,
    label: "Android App Bundle / APK (.aab, .apk)",
  },
  ios: {
    extensions: [".ipa"],
    mimeTypes: ["application/octet-stream", "application/x-itunes-ipa"],
    maxBytes: 200 * 1024 * 1024,
    label: "iOS App Archive (.ipa)",
  },
};

export const SOURCE_IMAGE_ACCEPT = {
  mimeTypes: ["image/png", "image/jpeg", "image/webp"],
  extensions: [".png", ".jpg", ".jpeg", ".webp"],
  maxBytes: 10 * 1024 * 1024,
};

export function platformToEnum(platform) {
  return platform === "android" ? "ANDROID" : "IOS";
}

export function getFileExtension(fileName) {
  const match = String(fileName || "").match(/(\.[a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

export function isAllowedBundle(platform, fileName, mimeType, size) {
  const rules = BUNDLE_ACCEPT[platform];
  if (!rules) return { ok: false, error: "Invalid platform" };
  const ext = getFileExtension(fileName);
  if (!rules.extensions.includes(ext)) {
    return { ok: false, error: `Bundle must be ${rules.extensions.join(" or ")}` };
  }
  if (mimeType && !rules.mimeTypes.includes(mimeType) && mimeType !== "application/zip") {
    // browsers often send octet-stream for aab/ipa
    if (mimeType !== "application/octet-stream") {
      return { ok: false, error: `Invalid bundle MIME type: ${mimeType}` };
    }
  }
  if (size > rules.maxBytes) {
    return { ok: false, error: `Bundle too large (max ${Math.round(rules.maxBytes / 1024 / 1024)}MB)` };
  }
  return { ok: true, ext };
}

export function storeExtensionsForPlatform(platform) {
  return STORE_UPLOAD_EXTENSIONS[platform] || [];
}

export function listingIconSize(platform) {
  return platform === "android" ? 512 : 1024;
}

export function isAndroidAppArchive(ext) {
  return ext === ".aab" || ext === ".apk";
}

export function androidAppArchiveUsageNote(ext) {
  if (ext === ".apk") {
    return "ไฟล์ APK — ทดสอบติดตั้ง / ตรวจ SHA-1 signing certificate";
  }
  if (ext === ".aab") {
    return "อัปโหลด .aab ใน Play Console → Release";
  }
  return "ไฟล์แอป Android";
}

export function androidAppArchiveLabel(ext) {
  if (ext === ".apk") return "APK";
  if (ext === ".aab") return "AAB";
  if (ext === ".ipa") return "IPA";
  return ext?.replace(/^\./, "").toUpperCase() || "App";
}

/** Store assets admins can preview before uploading to Play / App Store Connect. */
export const STORE_PREVIEW_ASSETS = {
  android: [
    {
      id: "listing-icon",
      label: "ไอคอน Play Store",
      usage: "512×512 px (.png, ไม่โปร่งใส)",
      width: 512,
      height: 512,
      kind: "icon",
      accept: ".png,.jpg,.jpeg,.webp",
    },
    {
      id: "phone-screenshot",
      label: "ภาพหน้าจอมือถือ",
      usage: "1080×1920 px ขึ้นไป (สัดส่วน 9:16 แนวตั้ง)",
      width: 1080,
      height: 1920,
      kind: "screenshot",
      minWidth: 320,
      minHeight: 320,
      maxWidth: 3840,
      maxHeight: 3840,
      accept: ".png,.jpg,.jpeg,.webp",
    },
    {
      id: "feature-graphic",
      label: "Feature Graphic (โปรโมต)",
      usage: "1024×500 px (.png หรือ .jpg)",
      width: 1024,
      height: 500,
      kind: "banner",
      accept: ".png,.jpg,.jpeg,.webp",
    },
  ],
  ios: [
    {
      id: "listing-icon",
      label: "ไอคอน App Store",
      usage: "1024×1024 px (.png, ไม่โปร่งใส)",
      width: 1024,
      height: 1024,
      kind: "icon",
      accept: ".png,.jpg,.jpeg,.webp",
    },
    {
      id: "iphone-screenshot",
      label: "ภาพหน้าจอ iPhone (6.7\")",
      usage: "1290×2796 px แนวตั้ง",
      width: 1290,
      height: 2796,
      kind: "screenshot",
      minWidth: 1242,
      minHeight: 2208,
      accept: ".png,.jpg,.jpeg,.webp",
    },
    {
      id: "ipad-screenshot",
      label: "ภาพหน้าจอ iPad (ถ้ามี)",
      usage: "2048×2732 px แนวตั้ง",
      width: 2048,
      height: 2732,
      kind: "screenshot",
      minWidth: 1536,
      minHeight: 2048,
      accept: ".png,.jpg,.jpeg,.webp",
    },
  ],
};

export function previewAssetsForPlatform(platform) {
  return STORE_PREVIEW_ASSETS[platform] || [];
}
