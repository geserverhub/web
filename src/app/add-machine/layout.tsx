'use client';

import { LocaleProvider } from '@/lib/LocaleContext';

export default function AddMachineLayout({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
