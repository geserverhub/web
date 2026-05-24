'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/LocaleContext';
import { UserCircle, LogOut, Mail, Shield, Building2, Hash } from 'lucide-react';
import { formatEnergyDisplayUser } from '@/lib/energy/display-user';

type EnergyUser = {
  userId?: number | string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  site?: string;
  typeID?: number | string;
  departmentID?: number | string;
};

const labels = {
  th: {
    subtitle: 'ข้อมูลบัญชีที่ล็อกอินในระบบพลังงาน',
    username: 'ชื่อผู้ใช้',
    name: 'ชื่อ-นามสกุล',
    email: 'อีเมล',
    role: 'บทบาท',
    site: 'ไซต์',
    userId: 'รหัสผู้ใช้',
    department: 'แผนก',
    logout: 'ออกจากระบบ',
    login: 'ไปหน้าเข้าสู่ระบบ',
    noSession: 'ยังไม่ได้ล็อกอิน',
    editSettings: 'ตั้งค่าอุปกรณ์',
  },
  en: {
    subtitle: 'Your energy dashboard account',
    username: 'Username',
    name: 'Full name',
    email: 'Email',
    role: 'Role',
    site: 'Site',
    userId: 'User ID',
    department: 'Department',
    logout: 'Sign out',
    login: 'Go to login',
    noSession: 'Not signed in',
    editSettings: 'Device settings',
  },
  ko: {
    subtitle: '에너지 대시보드 계정 정보',
    username: '사용자명',
    name: '이름',
    email: '이메일',
    role: '역할',
    site: '사이트',
    userId: '사용자 ID',
    department: '부서',
    logout: '로그아웃',
    login: '로그인',
    noSession: '로그인되지 않음',
    editSettings: '장치 설정',
  },
};

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function UserProfileContent() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const lang = ['th', 'ko', 'en'].includes(locale) ? locale : 'th';
  const ui = labels[lang as keyof typeof labels];

  const [user, setUser] = useState<EnergyUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('energy_system_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('energy_system_token');
    localStorage.removeItem('energy_system_user');
    router.push('/energy-dashboard-login');
  }

  if (!mounted) {
    return (
      <div className="p-6 text-sm text-slate-500">
        {lang === 'th' ? 'กำลังโหลด…' : lang === 'ko' ? '로딩 중…' : 'Loading…'}
      </div>
    );
  }

  const { displayName, displayRole } = formatEnergyDisplayUser(user);

  return (
    <div className="energy-page max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200">
          <UserCircle className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-emerald-900">{t('userProfile')}</h1>
          <p className="text-sm text-slate-500">{ui.subtitle}</p>
        </div>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm text-amber-800 mb-4">{ui.noSession}</p>
          <Link
            href="/energy-dashboard-login"
            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {ui.login}
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 bg-emerald-50/80 border-b border-emerald-100">
              <p className="text-base font-bold text-emerald-900">{displayName}</p>
              <p className="text-xs text-slate-500">@{user.username}</p>
            </div>
            <div className="px-4">
              <Row icon={Hash} label={ui.userId} value={String(user.userId ?? '')} />
              <Row icon={UserCircle} label={ui.username} value={user.username ?? ''} />
              <Row icon={Mail} label={ui.email} value={user.email ?? ''} />
              <Row icon={Shield} label={ui.role} value={displayRole} />
              <Row icon={Building2} label={ui.site} value={user.site ?? ''} />
              {user.departmentID != null && (
                <Row icon={Building2} label={ui.department} value={String(user.departmentID)} />
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/energy-dashboard/devices-setting"
              className="flex-1 text-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
            >
              {ui.editSettings}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {ui.logout}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
