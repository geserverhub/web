'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  GE_ENERGY_ERP_TOKEN_KEY,
  GE_ENERGY_ERP_USER_KEY,
  GE_ENERGY_ERP_PAGES_KEY,
} from '@/lib/ge-storage-keys';
import {
  ERP_COMPANY_NAMES,
  ERP_DASHBOARD_COPY,
  ERP_NAV_STRUCTURE,
  getErpNav,
  readErpLang,
  resolveErpRoute,
  writeErpLang,
} from '@/lib/ge-energy-erp-i18n';
import { ERP_ADMIN_PAGE_IDS } from '@/lib/erp-pages';
import { canManageErpAccess, erpApiHeaders } from '@/lib/erp-api-auth';
import ErpLangSwitcher from '@/components/ge-energy-erp/ErpLangSwitcher';
import ErpPageView from '@/components/ge-energy-erp/ErpPageView';

const DEFAULT_DEPT = ERP_NAV_STRUCTURE[0].id;
const DEFAULT_PAGE = ERP_NAV_STRUCTURE[0].pages[0];

function canAccessPage(pageAccess, pageId, erpUser) {
  if (canManageErpAccess(erpUser)) return true;
  if (ERP_ADMIN_PAGE_IDS.includes(pageId)) return false;
  return pageAccess[pageId] !== false;
}

export default function GeEnergyErpPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [erpUser, setErpUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [lang, setLang] = useState('th');
  const [activeDept, setActiveDept] = useState(DEFAULT_DEPT);
  const [activePage, setActivePage] = useState(DEFAULT_PAGE);
  const [pageAccess, setPageAccess] = useState({});

  const nav = useMemo(() => {
    const full = getErpNav(lang);
    if (canManageErpAccess(erpUser)) return full;
    return full
      .map((dept) => ({
        ...dept,
        pages: dept.pages.filter((p) => canAccessPage(pageAccess, p.id, erpUser)),
      }))
      .filter((dept) => dept.pages.length > 0);
  }, [lang, pageAccess, erpUser]);

  const activeDeptNav = nav.find((d) => d.id === activeDept) || nav[0];
  const activePageLabel =
    activeDeptNav?.pages.find((p) => p.id === activePage)?.label || activePage;

  const accessDenied =
    ready &&
    erpUser &&
    !canAccessPage(pageAccess, activePage, erpUser);

  const goTo = useCallback(
    (deptId, pageId) => {
      const resolved = resolveErpRoute(deptId, pageId);
      setActiveDept(resolved.dept);
      setActivePage(resolved.page);
      router.replace(
        `/ge-energy-erp?d=${resolved.dept}&p=${resolved.page}`,
        { scroll: false }
      );
    },
    [router]
  );

  useEffect(() => {
    const savedLang = readErpLang();
    setLang(savedLang);
    writeErpLang(savedLang);

    const token = localStorage.getItem(GE_ENERGY_ERP_TOKEN_KEY);
    if (!token) {
      router.replace('/ge-energy-erp-login');
      return;
    }

    let user = null;
    try {
      const raw = localStorage.getItem(GE_ENERGY_ERP_USER_KEY);
      user = raw ? JSON.parse(raw) : null;
      setErpUser(user);
      setUserName(user?.name || user?.username || '');
    } catch {
      setErpUser(null);
      setUserName('');
    }

    try {
      const cached = localStorage.getItem(GE_ENERGY_ERP_PAGES_KEY);
      if (cached) setPageAccess(JSON.parse(cached));
    } catch {
      setPageAccess({});
    }

    fetch('/api/ge-energy-erp/me/pages', { headers: erpApiHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.pages) {
          setPageAccess(data.pages);
          localStorage.setItem(GE_ENERGY_ERP_PAGES_KEY, JSON.stringify(data.pages));
        }
      })
      .catch(() => {});

    const d = searchParams.get('d');
    const p = searchParams.get('p');
    if (d || p) {
      const resolved = resolveErpRoute(d || DEFAULT_DEPT, p || DEFAULT_PAGE);
      setActiveDept(resolved.dept);
      setActivePage(resolved.page);
    } else {
      router.replace(`/ge-energy-erp?d=${DEFAULT_DEPT}&p=${DEFAULT_PAGE}`, {
        scroll: false,
      });
    }

    setReady(true);
  }, [router, searchParams]);

  useEffect(() => {
    if (!ready || !nav.length) return;
    const dept = nav.find((d) => d.id === activeDept);
    if (!dept) {
      goTo(nav[0].id, nav[0].pages[0]?.id);
      return;
    }
    if (!dept.pages.some((p) => p.id === activePage)) {
      goTo(dept.id, dept.pages[0]?.id);
    }
  }, [ready, nav, activeDept, activePage, goTo]);

  function handleLangChange(code) {
    setLang(code);
    writeErpLang(code);
  }

  function selectDept(deptId) {
    const dept = nav.find((d) => d.id === deptId);
    goTo(deptId, dept?.pages[0]?.id || DEFAULT_PAGE);
  }

  function signOut() {
    localStorage.removeItem(GE_ENERGY_ERP_TOKEN_KEY);
    localStorage.removeItem(GE_ENERGY_ERP_USER_KEY);
    localStorage.removeItem(GE_ENERGY_ERP_PAGES_KEY);
    router.push('/ge-energy-erp-login');
  }

  const t = ERP_DASHBOARD_COPY[lang] || ERP_DASHBOARD_COPY.th;
  const company = ERP_COMPANY_NAMES[lang] || ERP_COMPANY_NAMES.th;

  if (!ready) {
    return (
      <div className="geerp-shell">
        <div className="geerp-loading" role="status">
          {t.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="geerp-shell">
      <header className="geerp-topbar">
        <div className="geerp-topbar-brand">
          <Image
            src="/ge-energyTech/138568-transparent.png"
            alt="GE Energy Tech logo"
            width={36}
            height={36}
            className="geerp-topbar-logo"
            priority
          />
          <div>
            <strong>{company}</strong>
            <span>{t.tag}</span>
          </div>
        </div>
        {userName ? <div className="geerp-topbar-user">{userName}</div> : null}
        <div className="geerp-topbar-actions">
          <ErpLangSwitcher
            lang={lang}
            onChange={handleLangChange}
            ariaLabel={t.langLabel}
          />
          <Link href="/auth/select" className="geerp-btn geerp-btn-ghost">
            {t.menu}
          </Link>
          <button type="button" className="geerp-btn geerp-btn-ghost" onClick={signOut}>
            {t.signOut}
          </button>
        </div>
      </header>

      <nav className="geerp-dept-nav" aria-label={t.deptNavLabel}>
        {nav.map((dept) => (
          <button
            key={dept.id}
            type="button"
            className={`geerp-dept-tab ${activeDept === dept.id ? 'is-active' : ''}`}
            onClick={() => selectDept(dept.id)}
          >
            {dept.label}
          </button>
        ))}
        <Link
          href="/energy-dashboard-login"
          className="geerp-dept-tab geerp-dept-tab--link"
          style={{ marginLeft: 'auto' }}
        >
          ⚡ {t.energyDashboard}
        </Link>
      </nav>

      {activeDeptNav ? (
        <nav className="geerp-page-nav" aria-label={t.pageNavLabel}>
          {activeDeptNav.pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`geerp-page-tab ${activePage === page.id ? 'is-active' : ''}`}
              onClick={() => goTo(activeDept, page.id)}
            >
              {page.label}
            </button>
          ))}
        </nav>
      ) : null}

      <main className="geerp-main">
        <ErpPageView
          key={lang}
          lang={lang}
          deptId={activeDept}
          deptLabel={activeDeptNav?.label || ''}
          pageId={activePage}
          pageLabel={activePageLabel}
          erpUser={erpUser}
          accessDenied={accessDenied}
          onDevNavigate={(pageId) => goTo('rnd', pageId)}
        />
      </main>
    </div>
  );
}
