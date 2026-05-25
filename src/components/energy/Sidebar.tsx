"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/LocaleContext";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  BarChart2,
  MapPin,
  Bell,
  Settings,
  Monitor,
  Activity,
  GitCompare,
  Database,
  FileText,
  MessageSquare,
  HelpCircle,
  Users,
  UserCircle,
  LogOut,
  Gauge,
  Leaf,
  LogIn,
  Store,
  LineChart,
  Building2,
  Cable,
  Wind,
} from "lucide-react";
import "./energy-sidebar.css";

const companyNames: Record<string, string> = {
  th: "บริษัท จีอี อีเนอร์จี่ เทค จำกัด",
  en: "GE Energy Tech Co., Ltd.",
  ko: "(주식회사)지이 에너지텍",
};

type NavItem = {
  key: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  badge?: "live";
};

type NavSection = {
  sectionKey: string;
  items: NavItem[];
};

/** Green energy access → monitoring → configure → support */
const menuSections: NavSection[] = [
  {
    sectionKey: "menuGreenEnergy",
    items: [
      {
        key: "greenEnergyPortal",
        icon: Leaf,
        href: "/energy-dashboard/current-monitor",
        badge: "live",
      },
      { key: "energyLogin", icon: LogIn, href: "/energy-dashboard-login" },
      { key: "customerPortal", icon: Users, href: "/customer-dashboard-login" },
      { key: "customerDashboard", icon: Building2, href: "/customer-dashboard" },
      { key: "momogeMarketplace", icon: Store, href: "/momoge-product" },
      { key: "energyAnalytics", icon: LineChart, href: "/energy-dashboard/overview" },
    ],
  },
  {
    sectionKey: "menuMonitoring",
    items: [
      { key: "dashboard", icon: Home, href: "/energy-dashboard/dashboard", exact: true },
      { key: "currentMonitor", icon: Activity, href: "/energy-dashboard/current-monitor", badge: "live" },
      { key: "overview", icon: BarChart2, href: "/energy-dashboard/overview" },
      { key: "carbonCredits", icon: Leaf, href: "/energy-dashboard/carbon-credits" },
      { key: "monitor", icon: Monitor, href: "/energy-dashboard/monitor", exact: true },
      { key: "compareMonitoring", icon: GitCompare, href: "/energy-dashboard/monitor/Compare-Monitoring" },
      { key: "location", icon: MapPin, href: "/energy-dashboard/location" },
      { key: "carbonTracker", icon: Wind, href: "/energy-dashboard/carbon" },
    ],
  },
  {
    sectionKey: "configurations",
    items: [
      { key: "notifications", icon: Bell, href: "/energy-dashboard/notifications" },
      { key: "deviceConnectivity", icon: Cable, href: "/energy-dashboard/device-connectivity" },
      { key: "devicesSetting", icon: Settings, href: "/energy-dashboard/devices-setting" },
      { key: "meterSetting", icon: Gauge, href: "/energy-dashboard/meter-seting" },
    ],
  },
  {
    sectionKey: "menuTools",
    items: [{ key: "developer", icon: Database, href: "/energy-dashboard/developer" }],
  },
  {
    sectionKey: "userSupports",
    items: [
      { key: "productsInfo", icon: FileText, href: "/energy-dashboard/products-info" },
      { key: "supportTickets", icon: MessageSquare, href: "/energy-dashboard/support-tickets" },
      { key: "userFeedback", icon: Users, href: "/energy-dashboard/user-feedback" },
      { key: "helpDocs", icon: HelpCircle, href: "/energy-dashboard/help-docs" },
      { key: "userProfile", icon: UserCircle, href: "/energy-dashboard/profile" },
    ],
  },
];

const sectionFallback: Record<string, Record<string, string>> = {
  menuGreenEnergy: { th: "พลังงานสีเขียว", en: "Green Energy", ko: "그린 에너지" },
  menuMonitoring: { th: "มอนิเตอร์พลังงาน", en: "Energy Monitoring", ko: "에너지 모니터링" },
  menuTools: { th: "เครื่องมือ", en: "Tools", ko: "도구" },
  configurations: { th: "การตั้งค่า", en: "Configurations", ko: "설정" },
  userSupports: { th: "สนับสนุนผู้ใช้", en: "User Supports", ko: "사용자 지원" },
  greenEnergyPortal: { th: "พอร์ทัลพลังงานสีเขียว", en: "Green Energy Portal", ko: "그린 에너지 포털" },
  energyLogin: { th: "ลงชื่อ เข้าระบบใหม่", en: "Sign in again", ko: "다시 로그인" },
  customerPortal: { th: "เข้าใช้ผ่านสมาร์ทโฟน", en: "Access via smartphone", ko: "스마트폰으로 이용" },
  customerDashboard: { th: "แดชบอร์ดลูกค้า", en: "Customer dashboard", ko: "고객 대시보드" },
  momogeMarketplace: { th: "สินค้า IoT / Momoge", en: "Momoge IoT Store", ko: "MOMOGE IoT 상품" },
  energyAnalytics: { th: "วิเคราะห์พลังงาน", en: "Energy analytics", ko: "에너지 분석" },
  compareMonitoring: { th: "เปรียบเทียบ", en: "Compare", ko: "비교 모니터" },
  carbonCredits: { th: "คาร์บอนเครดิต", en: "Carbon Credits", ko: "탄소 크레딧" },
  deviceConnectivity: {
    th: "เชื่อมต่ออุปกรณ์",
    en: "Device connectivity",
    ko: "장치 연결",
  },
  live: { th: "สด", en: "Live", ko: "실시간" },
  carbonTracker: { th: "คาร์บอน & พลังงาน", en: "Carbon & Energy", ko: "탄소 & 에너지" },
};

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function sectionLabel(sectionKey: string, locale: string, t: (k: string) => string): string {
  if (sectionFallback[sectionKey]?.[locale]) return sectionFallback[sectionKey][locale];
  if (sectionFallback[sectionKey]?.en) return sectionFallback[sectionKey].en;
  const translated = t(sectionKey);
  if (translated !== sectionKey) return translated;
  return sectionKey;
}

function itemLabel(key: string, locale: string, t: (k: string) => string): string {
  if (sectionFallback[key]?.[locale]) return sectionFallback[key][locale];
  if (sectionFallback[key]?.en) return sectionFallback[key].en;
  const translated = t(key);
  if (translated !== key) return translated;
  return key;
}

export default function Sidebar() {
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const lang = ["th", "ko", "en"].includes(locale) ? locale : "th";
  const company = companyNames[lang] ?? companyNames.th;

  const signOutLabel = (() => {
    const translated = t("signOut");
    if (translated !== "signOut") return translated;
    return locale === "th" ? "ออกจากระบบ" : locale === "ko" ? "로그아웃" : "Sign out";
  })();

  function handleSignOut() {
    localStorage.removeItem("energy_system_token");
    localStorage.removeItem("energy_system_user");
    router.push("/energy-dashboard-login");
  }

  return (
    <aside className="esb-root flex flex-col h-full shrink-0">
      <div className="esb-brand">
        <Link href="/energy-dashboard/dashboard" className="esb-brand-link">
          <Image
            src="/momoge/Logo-brand.png"
            alt="GE Energy Tech"
            width={160}
            height={88}
            className="esb-brand-logo"
            priority
          />
          <p className="esb-brand-name">{company}</p>
        </Link>
      </div>

      <nav className="esb-nav" aria-label="Energy dashboard menu">
        {menuSections.map((section) => (
          <div
            key={section.sectionKey}
            className={`esb-section esb-section-panel esb-section--${section.sectionKey}${
              section.sectionKey === "menuGreenEnergy" ? " esb-section-highlight" : ""
            }`}
          >
            <div className="esb-section-title">
              <span>{sectionLabel(section.sectionKey, lang, t)}</span>
              <div className="esb-section-line" />
            </div>
            <ul className="esb-list">
              {section.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={`${section.sectionKey}-${item.href}`}>
                    <Link
                      href={item.href}
                      className={`esb-link${active ? " esb-link-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="esb-icon-wrap">
                        <Icon className="esb-icon" strokeWidth={2} />
                      </span>
                      <span className="esb-label">{itemLabel(item.key, lang, t)}</span>
                      {item.badge === "live" && (
                        <span className="esb-badge">
                          {sectionFallback.live[lang] ?? "Live"}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="esb-footer">
        <button type="button" onClick={handleSignOut} className="esb-logout">
          <LogOut className="w-4 h-4" strokeWidth={2} />
          <span>{signOutLabel}</span>
        </button>
      </div>
    </aside>
  );
}
