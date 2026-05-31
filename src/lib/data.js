export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export const languageStorageKey = "goeun-agency-language";

/** Public hub (ngrok) — homepage login and external portal links */
export const publicHubBaseUrl =
  process.env.NEXT_PUBLIC_PUBLIC_HUB_URL ||
  process.env.NEXT_PUBLIC_PORTAL_BASE_URL ||
  "https://strong-dory-enabled.ngrok-free.app";

/** Absolute URL on the public hub (e.g. ngrok) for platform / ERP pages */
export function publicHubHref(path) {
  const base = publicHubBaseUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export const authSelectUrl = `${publicHubBaseUrl}/auth/select`;

/** Homepage + agency pages: Thai, English, Korean only */
export const supportedLanguages = ["th", "en", "ko"];

export const languageOptions = [
  { key: "th", label: "ไทย" },
  { key: "en", label: "English" },
  { key: "ko", label: "한국어" },
];

export const fallbackProfile = {
  brand_name: "GE SERVER HUB",
  headline: "ศูนย์กลางระบบลูกค้าและหน้าโปรโมทบริการของคุณ",
  subheadline:
    "รวมหน้าแนะนำบริการ, ช่องทางติดต่อ, และทางเข้าระบบสำหรับลูกค้าหลายรายไว้ในเว็บเดียว",
  phone: "081-234-5678\n010-8105-0384",
  email: "goeunserverhub@gmail.com",
  address: "Bangkok, Thailand\nAnsan, Republic of Korea",
};

export const fallbackServices = [
  {
    id: 1,
    title: "บริการดูแลระบบ",
    description: null,
    highlight: "ดูแลและบำรุงรักษาระบบ",
  },
  {
    id: 2,
    title: "บริการเช่าโดเมนรายปี",
    description: null,
    highlight: "จดและต่ออายุโดเมน",
  },
  {
    id: 3,
    title: "บริการยิงแอด",
    description: null,
    highlight: "โฆษณา Facebook/Google",
  },
  {
    id: 4,
    title: "บริการออกแบบหน้าเว็บ",
    description: null,
    highlight: "UI/UX Design",
  },
  {
    id: 5,
    title: "บริการพัฒนาระบบ",
    description: null,
    highlight: "พัฒนาซอฟต์แวร์ตามความต้องการ",
  },
  {
    id: 6,
    title: "บริการอื่นๆ",
    description: null,
    highlight: "บริการเสริมอื่นๆ",
  },
];

export const fallbackClients = [
  {
    id: 1,
    name: "M-Group",
    slug: "m-group",
    description:
      "\"ดูแล ใส่ใจ เกษตรไทย ครบวงจร\" บริการสินค้าด้านการเกษตร ในราคาปลีก-ส่ง ด้วยสินค้าหลากหลายมากกว่า 10,000 รายการ",
    status: "online",
    contact_email: "sale@m-group.in.th",
    contact_phone: "089-4871144",
    contact_fax: "034-878369, 034-848022",
    thumbnail: "/m-group-building.jpg",
    system_url: "https://strong-dory-enabled.ngrok-free.app/m-group",
  },
  {
    id: 2,
    name: "Green Retail Group",
    slug: "green-retail-group",
    description: "ระบบมอนิเตอริ่ง ผู้ใช้ Demo",
    status: "online",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
    thumbnail: "/momoge/momoge-space.jpg",
    thumbnail_fit: "contain",
    thumbnail_style: "photo",
    system_url:
      "https://strong-dory-enabled.ngrok-free.app/customer-dashboard-login",
  },
  {
    id: 3,
    name: "M-Factory",
    slug: "m-factory",
    description: "ขาย-ให้เช่าโกดัง โรงงาน พร้อมบริการที่พัก รีสอร์ทส่วนตัว",
    status: "online",
    contact_email: "m.factoryandresort@gmail.com",
    contact_phone: "+66 095-241-1833",
    thumbnail: "/m-factory/LINE_ALBUM_12369_260417_1.jpg",
    system_url: "https://m-factoryandresort.com/",
  },
  {
    id: 4,
    name: "M-Resort",
    slug: "m-retsort",
    description: "เอ็มรีสอร์ท บริการที่พัก บรรยากาศส่วนตัว",
    status: "online",
    contact_email: "mukhngamnuch@gmail.com",
    contact_phone: "095-241-1833",
    thumbnail: "/uploads/logos/1776692894976-ecji3u.jpg",
    system_url: "https://m-factoryandresort.com/",
  },
  {
    id: 5,
    name: "คาโก้ ไทย-เกาหลี / เกาหลี-ไทย",
    slug: "cargo",
    description: "บริการส่งสินค้าทางเครื่องบิน ไทย ↔ เกาหลี ปลอดภัย รวดเร็ว พร้อมติดตามสถานะออนไลน์",
    status: "online",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "+66 095-241-1833",
    thumbnail: "/uploads/logos/cargo.jpg",
    system_url: "/cargo/track",
  },
  {
    id: 6,
    name: "MOMOGE SPACE  PRODUCT",
    slug: "momoge-space-product",
    description: "AI SMART ENERGY MONITORING PLATFORM WITH IOT PRODUCTS",
    status: "online",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
    thumbnail: "/momoge/Logo-brand.png",
    thumbnail_fit: "contain",
    system_url: "https://strong-dory-enabled.ngrok-free.app/momoge-product",
  },
  {
    id: 7,
    name: "SP Foods Co.,Ltd.",
    slug: "spfoods",
    description: "ส.ภาวิณีร์ อีสานฟู้ดส์ ผู้ผลิตและจำหน่าย นำเข้า-ส่งออก อาหารแปรรูป อาหารแช่แข็ง ผู้ผลิตและจำหน่ายอาหารไทยแปรรูปที่ได้มาตรฐานเจ้าเดียวในเกาหลี ครบวงจรด้านอุตสาหกรรมอาหาร ผสมผสานเทคโนโลยีร่วมกับอุตสาหกรรมอาหารและการเกษตร เพื่อผลิตอาหารแปรรูปที่มีคุณภาพและได้มาตรฐานสากล",
    status: "online",
    contact_email: "info@spfoods.com",
    contact_phone: "02-1234-5678",
    address: "경기도 화성시 서신면 흔들길 42",
    thumbnail: "/uploads/logos/spfoods-main.jpg",
    system_url: "https://spfoodskorea.com/",
  },
  {
    id: 8,
    name: "ระบบมาร์ทและซุปเปอร์มาเก็ต",
    slug: "mart-supermarket",
    description: "ระบบจัดการร้านค้าปลีก มาร์ท และซุปเปอร์มาเก็ต ครบวงจร",
    status: "coming-soon",
    contact_email: "",
    contact_phone: "",
    thumbnail: "/mart-1/134074.jpg",
    system_url: "#",
  },
  {
    id: 9,
    name: "ระบบบริการดูแล บัญชีและภาษี",
    slug: "acc-tax",
    description: "บริการดูแลและจัดการบัญชี การเงิน และภาษีอย่างครบวงจร โดยทีมผู้เชี่ยวชาญ",
    status: "coming-soon",
    contact_email: "",
    contact_phone: "",
    thumbnail: "/ACC/134076.jpg",
    thumbnail_fit: "contain",
    thumbnail_style: "photo",
    system_url: "#",
  },
  {
    id: 10,
    name: "ห้องเรียนออนไลน์",
    slug: "online-classroom",
    description: "เรียนออนไลน์ — ห้องเรียนสด วิดีโอบันทึก เอกสาร และตารางเรียน",
    status: "online",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
    thumbnail: "/classroom/137806.jpg",
    system_url: "https://strong-dory-enabled.ngrok-free.app/online-classroom-login",
  },
  {
    id: 11,
    name: "GE ENERGY TECH CO., LTD.",
    slug: "ge-energy-tech",
    description:
      "บริษัทเทคโนโลยีพลังงานอัจฉริยะ — มอนิเตอร์พลังงาน IoT การจัดการพลังงาน และโซลูชันเทคโนโลยีสีเขียวในไทยและเอเชีย",
    status: "online",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
    address: "경기도 안산시 상록구 월피동 445-28 301호",
    thumbnail: "/ge-energyTech/138568-transparent.png",
    thumbnail_fit: "contain",
    system_url: "https://www.ge-energytech.com",
  },
];

export const filterOptions = [
  { key: "all", label: "ทั้งหมด" },
  { key: "online", label: "พร้อมใช้งาน" },
  { key: "maintenance", label: "บำรุงรักษา" },
  { key: "coming-soon", label: "เร็ว ๆ นี้" },
];

const fallbackBySlug = Object.fromEntries(fallbackClients.map((c) => [c.slug, c]));

const PORTAL_URL_OVERRIDES = {
  "green-retail-group":
    "https://strong-dory-enabled.ngrok-free.app/customer-dashboard-login",
  "green-retail-energy": "/energy-dashboard-login",
  "m-group": "/m-group",
  "m-factory": "https://m-factoryandresort.com/",
  "online-classroom":
    "https://strong-dory-enabled.ngrok-free.app/online-classroom-login",
  "ge-energy-tech": "https://www.ge-energytech.com",
};

/** Resolve portal URL for API cards when DB systemUrl is empty or invalid. */
export function resolveClientPortalUrl(client) {
  if (!client) return null;
  const status = String(client.status || "").toLowerCase();
  if (status === "coming-soon" || status === "maintenance") return null;

  const slug = client.slug;
  const raw = String(client.system_url ?? client.systemUrl ?? "").trim();
  let url =
    raw && raw !== "#"
      ? raw
      : PORTAL_URL_OVERRIDES[slug] || fallbackBySlug[slug]?.system_url || "";

  url = String(url).trim();
  if (!url || url === "#") return null;
  if (url.startsWith("/") || /^https?:\/\//i.test(url)) return url;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(url)) return `https://${url}`;
  return url;
}

export function isExternalPortalUrl(url) {
  return Boolean(url && /^https?:\/\//i.test(url));
}

export function clientPortalUrl(slug) {
  return `${backendBaseUrl}/portal/${slug}`;
}

export function clientLoginUrl(slug) {
  return `${backendBaseUrl}/go/${slug}`;
}

export function statusClassName(status) {
  if (status === "online") return "status-online";
  if (status === "maintenance") return "status-maintenance";
  return "status-coming-soon";
}

export async function getJson(paths) {
  const { parseJsonResponse } = await import("@/lib/parse-json-response");
  const candidates = Array.isArray(paths) ? paths : [paths];
  let lastError = null;
  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      const data = await parseJsonResponse(response);
      if (data._html) throw new Error(data.error || "Server returned HTML instead of JSON");
      if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
      return data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Request failed");
}
