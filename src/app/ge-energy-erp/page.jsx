import { Suspense } from 'react';
import GeEnergyErpPageClient from './GeEnergyErpPageClient';
import './ge-energy-erp.css';

function ErpPageFallback() {
  return (
    <div className="geerp-shell">
      <div className="geerp-loading" role="status">
        Loading…
      </div>
    </div>
  );
}

export default function GeEnergyErpPage() {
  return (
    <Suspense fallback={<ErpPageFallback />}>
      <GeEnergyErpPageClient />
    </Suspense>
  );
}
