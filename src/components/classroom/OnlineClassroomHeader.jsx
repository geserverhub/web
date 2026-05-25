'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LogOut, BookOpenCheck, LayoutGrid } from 'lucide-react';
import { CLASSROOM_TOKEN_KEY, CLASSROOM_USER_KEY } from '@/lib/classroom-storage-keys';

const navCopy = {
  th: {
    portal: 'ห้องเรียนออนไลน์',
    sub: 'GE SERVER HUB — E-Learning',
    home: 'หน้าหลัก',
    homework: 'ที่ปรึกษาการบ้าน-รายงาน',
    logout: 'ออกจากระบบ',
  },
  en: {
    portal: 'Online Classroom',
    sub: 'GE SERVER HUB — E-Learning',
    home: 'Home',
    homework: 'Homework & Report Advisor',
    logout: 'Sign out',
  },
  ko: {
    portal: '온라인 강의실',
    sub: 'GE SERVER HUB — E-Learning',
    home: '홈',
    homework: '과제·보고서 상담',
    logout: '로그아웃',
  },
};

const LANG_OPTIONS = [
  { code: 'th', label: 'TH' },
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
];

export default function OnlineClassroomHeader({ lang = 'th', onLangChange }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = navCopy[lang] || navCopy.th;

  const links = [
    { href: '/online-classroom', label: t.home, icon: LayoutGrid, exact: true },
    {
      href: '/online-classroom/homework-advisor',
      label: t.homework,
      icon: BookOpenCheck,
      exact: false,
    },
  ];

  function handleLogout() {
    localStorage.removeItem(CLASSROOM_TOKEN_KEY);
    localStorage.removeItem(CLASSROOM_USER_KEY);
    router.replace('/online-classroom-login');
  }

  function handleLang(code) {
    localStorage.setItem('ge_lang', code);
    if (onLangChange) onLangChange(code);
  }

  return (
    <header className="oc-header">
      <div className="oc-header-brand">
        <div className="oc-header-icon" aria-hidden>
          <GraduationCap size={22} strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="oc-header-title">{t.portal}</h1>
          <p className="oc-header-sub">{t.sub}</p>
        </div>
      </div>

      {/* Language switcher */}
      <div className="oc-lang-switch" aria-label="Language">
        {LANG_OPTIONS.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLang(code)}
            className={`oc-lang-btn${lang === code ? ' oc-lang-btn--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <button type="button" className="oc-logout" onClick={handleLogout}>
        <LogOut size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        {t.logout}
      </button>
      <nav className="oc-nav" aria-label="Classroom menu">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`oc-nav-link${active ? ' oc-nav-link--active' : ''}`}
            >
              <Icon size={16} strokeWidth={2.25} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
