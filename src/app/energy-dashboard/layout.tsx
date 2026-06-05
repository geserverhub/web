import { ENERGY_DASHBOARD_AUTH_INLINE_SCRIPT } from '@/lib/chunk-recovery';
import EnergyDashboardLayoutClient from './EnergyDashboardLayoutClient';

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
