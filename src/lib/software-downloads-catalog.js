/** Software / file catalog — binaries live in storage/software-downloads/<filePath> */
export const softwareDownloadProducts = [
  {
    slug: "phone-remote-android",
    title: "Phone Remote (Android)",
    titleTh: "Phone Remote — แอป Android",
    description: "แอปรีโมทและแชร์หน้าจอ พร้อมควบคุมจาก Viewer หลังเปิด Accessibility",
    platform: "Android",
    version: "1.0.0",
    price: 10000,
    currency: "KRW",
    filePath: "phone-remote/PhoneRemote-android.apk",
    fileName: "PhoneRemote-android.apk",
    icon: "/logo-mark.svg",
    sortOrder: 1,
    active: true,
    free: false,
  },
  {
    slug: "momoge-space-android",
    title: "Momoge space (Android)",
    titleTh: "Momoge space — แอป Android",
    description: "แอป Customer Dashboard สำหรับ Momoge space",
    platform: "Android",
    version: "1.0.1",
    price: 0,
    currency: "THB",
    filePath: "momoge-space/MomogeSpace-android.apk",
    fileName: "MomogeSpace-android.apk",
    icon: "/momoge/Logo-brand.png",
    sortOrder: 2,
    active: true,
    free: true,
  },
  {
    slug: "cargo-android",
    title: "คาโก้ ไทย-เกาหลี (Android)",
    titleTh: "คาโก้ ไทย-เกาหลี — แอป Android",
    description: "แอพ บริการส่งสินค้าจากไทย ไปเกาหลี",
    platform: "Android",
    version: "1.0.0",
    price: 0,
    currency: "THB",
    filePath: "cargo/CargoThaiKorea-android.apk",
    fileName: "CargoThaiKorea-android.apk",
    icon: "/cargo/cargo-logo.png",
    sortOrder: 3,
    active: true,
    free: true,
  },
];

export function getActiveSoftwareProducts() {
  return [...softwareDownloadProducts]
    .filter((p) => p.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSoftwareProduct(slug) {
  const key = String(slug || "").trim().toLowerCase();
  return softwareDownloadProducts.find((p) => p.active && p.slug === key) || null;
}

export function productToPublicJson(product) {
  if (!product) return null;
  return {
    slug: product.slug,
    title: product.title,
    titleTh: product.titleTh || product.title,
    description: product.description,
    platform: product.platform,
    version: product.version,
    price: Number(product.price),
    currency: product.currency,
    icon: product.icon,
    free: Boolean(product.free || Number(product.price) <= 0),
  };
}
