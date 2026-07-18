import type { Metadata } from 'next';
import { ENERGY_DASHBOARD_AUTH_INLINE_SCRIPT } from '@/lib/chunk-recovery';
import EnergyDashboardLayoutClient from './EnergyDashboardLayoutClient';

const GEET_LOGO = '/ge-energyTech/138568.jpg';

export const metadata: Metadata = {
  title: 'GE ENERGY TECH',
  description: 'GE Energy Tech — Smart Energy IoT Monitoring Dashboard',
  icons: {
    icon: [{ url: GEET_LOGO, type: 'image/jpeg' }],
    apple: [{ url: GEET_LOGO, type: 'image/jpeg' }],
    shortcut: [GEET_LOGO],
  },
  openGraph: {
    title: 'GE ENERGY TECH',
    description: 'GE Energy Tech — Smart Energy IoT Monitoring Dashboard',
    images: [{ url: GEET_LOGO, alt: 'GE Energy Tech logo' }],
  },
};

export default function EnergyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ENERGY_DASHBOARD_AUTH_INLINE_SCRIPT }} />
      <EnergyDashboardLayoutClient>{children}</EnergyDashboardLayoutClient>
    </>
  );
}
