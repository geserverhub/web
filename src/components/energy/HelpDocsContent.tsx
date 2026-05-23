'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/LocaleContext';
import {
  HelpCircle,
  BookOpen,
  Activity,
  Monitor,
  Settings,
  MessageSquare,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react';

type GuideLink = {
  href: string;
  labelKey: string;
  icon: typeof Activity;
};

const quickLinks: GuideLink[] = [
  { href: '/energy-dashboard/dashboard', labelKey: 'dashboard', icon: BookOpen },
  { href: '/energy-dashboard/current-monitor', labelKey: 'currentMonitor', icon: Activity },
  { href: '/energy-dashboard/monitor', labelKey: 'monitor', icon: Monitor },
  { href: '/energy-dashboard/devices-setting', labelKey: 'devicesSetting', icon: Settings },
  { href: '/energy-dashboard/support-tickets', labelKey: 'supportTickets', icon: MessageSquare },
  { href: '/energy-dashboard/developer', labelKey: 'developer', icon: HelpCircle },
];

const faqCopy = {
  th: [
    {
      q: 'ล็อกอินไม่ได้?',
      a: 'ตรวจสอบ username/password ที่ /energy-dashboard-login และให้ dev server + ฐานข้อมูล WSL ทำงานอยู่',
    },
    {
      q: 'ไม่เห็นข้อมูลอุปกรณ์?',
      a: 'เลือกลูกค้าและอุปกรณ์ในหน้า Current Monitor หรือตั้งค่าอุปกรณ์ใน Device Settings',
    },
    {
      q: 'เปลี่ยนภาษาได้ที่ไหน?',
      a: 'มุมขวาบนของ Header — ไทย / 한국어 / EN',
    },
  ],
  en: [
    {
      q: 'Cannot log in?',
      a: 'Check credentials at /energy-dashboard-login and ensure dev server and database are running.',
    },
    {
      q: 'No device data?',
      a: 'Select customer and device on Current Monitor, or configure devices in Device Settings.',
    },
    {
      q: 'How to change language?',
      a: 'Use the language switcher at the top-right of the header (TH / KO / EN).',
    },
  ],
  ko: [
    {
      q: '로그인이 안 됩니다',
      a: '/energy-dashboard-login 에서 계정을 확인하고 dev 서버와 DB가 실행 중인지 확인하세요.',
    },
    {
      q: '장치 데이터가 없습니다',
      a: 'Current Monitor에서 장치를 선택하거나 Device Settings에서 설정하세요.',
    },
    {
      q: '언어 변경 방법?',
      a: '헤더 오른쪽 상단 언어 버튼(ไทย / 한국어 / EN)을 사용하세요.',
    },
  ],
};

export default function HelpDocsContent() {
  const { t, locale } = useLocale();
  const lang = ['th', 'ko', 'en'].includes(locale) ? locale : 'th';
  const faq = faqCopy[lang as keyof typeof faqCopy];

  const contactTitle =
    lang === 'th' ? 'ติดต่อฝ่ายสนับสนุน' : lang === 'ko' ? '지원 연락처' : 'Contact support';

  return (
    <div className="energy-page max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
          <HelpCircle className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-emerald-900">{t('helpDocs')}</h1>
          <p className="text-sm text-slate-500">{t('helpAndDocumentation')}</p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-emerald-900 mb-1">{t('keyFeatures')}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{t('systemUsageGuideDescription')}</p>
        <p className="text-sm text-slate-500 mt-2">{t('sidebarMenuDescription')}</p>
      </section>

      <section className="mb-6 rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-emerald-50 bg-emerald-50/60">
          <h2 className="text-sm font-bold text-emerald-900">
            {lang === 'th' ? 'ลิงก์ด่วน' : lang === 'ko' ? '빠른 링크' : 'Quick links'}
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/50 transition-colors group"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700">{t(item.labelKey)}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-emerald-900 mb-3">
          {lang === 'th' ? 'คำถามที่พบบ่อย' : lang === 'ko' ? 'FAQ' : 'FAQ'}
        </h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <div key={item.q}>
              <p className="text-sm font-semibold text-slate-800">{item.q}</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-emerald-900 mb-3">{contactTitle}</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <a
            href="mailto:goeunserverhub@gmail.com"
            className="flex items-center gap-2 hover:text-emerald-700"
          >
            <Mail className="h-4 w-4 text-emerald-600" />
            goeunserverhub@gmail.com
          </a>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-600" />
            010-8105-0384
          </p>
        </div>
        <Link
          href="/energy-dashboard/user-feedback"
          className="inline-flex mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          {t('sendFeedback')} →
        </Link>
      </section>
    </div>
  );
}
