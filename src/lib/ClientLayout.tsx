'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import './energy-theme.css';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/energy-dashboard-login' || pathname === '/login';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="energy-app flex h-screen overflow-visible">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-visible w-full lg:w-auto min-w-0">
        <Header />
        <main className="energy-main flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
