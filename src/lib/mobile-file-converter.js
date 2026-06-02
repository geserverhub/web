/** Store upload rules and conversion presets for admin mobile file converter. */

export const ICON_SIZE_PRESETS = {
  android: [48, 72, 96, 144, 192, 512],
  ios: [60, 76, 120, 152, 167, 180, 1024],
};

/** Extensions accepted when uploading to each store (after conversion or release). */
export const STORE_UPLOAD_EXTENSIONS = {
  android: [
    { ext: ".aab", label: "Android App Bundle", usage: "อัปโหลด Release ใน Google Play Console" },
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
    extensions: [".aab"],
    mimeTypes: ["application/octet-stream", "application/vnd.android.package-archive"],
    maxBytes: 200 * 1024 * 1024,
    label: "Android App Bundle (.aab)",
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
