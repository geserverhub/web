"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Code,
  BrainCircuit,
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
  Database,
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
      { key: "monitor", icon: Monitor, href: "/energy-dashboard/monitor", exact: true },
      { key: "compareMonitoring", icon: GitCompare, href: "/energy-dashboard/monitor/Compare-Monitoring" },
      { key: "location", icon: MapPin, href: "/energy-dashboard/location" },
    ],
  },
  {
    sectionKey: "configurations",
    items: [
      { key: "notifications", icon: Bell, href: "/energy-dashboard/notifications" },
      { key: "devicesSetting", icon: Settings, href: "/energy-dashboard/devices-setting" },
      { key: "meterSetting", icon: Gauge, href: "/energy-dashboard/meter-seting" },
    ],
  },
  {
    sectionKey: "menuTools",
    items: [
      { key: "developer", icon: Code, href: "/energy-dashboard/developer" },
      { key: "databaseBackup", icon: Database, href: "/energy-dashboard/backup" },
      { key: "aiSettings", icon: BrainCircuit, href: "/energy-dashboard/ai-settings" },
    ],
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
  energyLogin: { th: "เข้าใช้ผ่านสมาร์ทโฟน", en: "Access via smartphone", ko: "스마트폰으로 이용" },
  customerPortal: { th: "เข้าใช้ผ่านสมาร์ทโฟน", en: "Access via smartphone", ko: "스마트폰으로 이용" },
  customerDashboard: { th: "แดชบอร์ดลูกค้า", en: "Customer dashboard", ko: "고객 대시보드" },
  momogeMarketplace: { th: "สินค้า IoT / Momoge", en: "Momoge IoT Store", ko: "MOMOGE IoT 상품" },
  energyAnalytics: { th: "วิเคราะห์พลังงาน", en: "Energy analytics", ko: "에너지 분석" },
  compareMonitoring: { th: "เปรียบเทียบ", en: "Compare", ko: "비교 모니터" },
  developer: { th: "ผู้พัฒนา", en: "Developer", ko: "개발자" },
  databaseBackup: { th: "백업ฐานข้อมูล", en: "Database Backup", ko: "데이터베이스 백업" },
  aiSettings: { th: "ตั้งค่า AI", en: "AI Settings", ko: "AI 설정" },
  live: { th: "สด", en: "Live", ko: "실시간" },
};

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function sectionLabel(sectionKey: string, locale: string, t: (k: string) => string): string {
  const translated = t(sectionKey);
  if (translated !== sectionKey) return translated;
  return sectionFallback[sectionKey]?.[locale] ?? sectionFallback[sectionKey]?.en ?? sectionKey;
}

function itemLabel(key: string, locale: string, t: (k: string) => string): string {
  const translated = t(key);
  if (translated !== key) return translated;
  return sectionFallback[key]?.[locale] ?? sectionFallback[key]?.en ?? key;
}

export default function Sidebar() {
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const lang = ["th", "ko", "en"].includes(locale) ? locale : "th";
  const company = companyNames[lang] ?? companyNames.th;

  const backMain =
    locale === "th" ? "กลับหน้าหลัก" : locale === "ko" ? "메인으로" : "Back to Main";

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
        <Link href="/energy-dashboard/dashboard" className="esb-logout">
          <LogOut className="w-4 h-4" strokeWidth={2} />
          <span>{backMain}</span>
        </Link>
      </div>
    </aside>
  );
}
