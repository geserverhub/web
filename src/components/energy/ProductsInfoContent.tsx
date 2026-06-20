'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/LocaleContext';
import { useSite } from '@/lib/SiteContext';
import { Package, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

const copy = {
  th: {
    title: 'ข้อมูลผลิตภัณฑ์',
    subtitle: 'รายการผลิตภัณฑ์และอุปกรณ์ในระบบพลังงาน',
    loading: 'กำลังโหลด…',
    empty: 'ยังไม่มีข้อมูลผลิตภัณฑ์จาก API',
    error: 'โหลดข้อมูลไม่สำเร็จ',
    momogeLink: 'ดูสินค้า MOMOGE Marketplace',
    colName: 'ชื่อผลิตภัณฑ์',
    colId: 'รหัส',
    colNote: 'หมายเหตุ',
  },
  en: {
    title: 'Products Info',
    subtitle: 'Energy system product catalog',
    loading: 'Loading…',
    empty: 'No products returned from API',
    error: 'Failed to load products',
    momogeLink: 'Open MOMOGE Marketplace',
    colName: 'Product name',
    colId: 'ID',
    colNote: 'Notes',
  },
  ko: {
    title: '제품 정보',
    subtitle: '에너지 시스템 제품 목록',
    loading: '로딩 중…',
    empty: 'API에서 제품이 없습니다',
    error: '제품 로드 실패',
    momogeLink: 'MOMOGE 마켓플레이스',
    colName: '제품명',
    colId: 'ID',
    colNote: '비고',
  },
};

type ProductRow = {
  id?: string | number;
  name?: string | null;
  description?: string | null;
  model?: string | null;
  brand?: string | null;
};

/** Localised descriptions keyed by productID */
const descI18n: Record<number, Record<string, string>> = {
  1: {
    th: 'เครื่องประหยัดพลังงานสำหรับโหลดเริ่มต้น',
    en: 'Energy saver for starter loads',
    ko: '초기 부하용 에너지 절약 장치',
  },
  2: {
    th: 'เครื่องประหยัดพลังงานสำหรับร้านค้า/อาคารกลาง',
    en: 'Energy saver for shops / medium buildings',
    ko: '상점/중형 건물용 에너지 절약 장치',
  },
  3: {
    th: 'เครื่องประหยัดพลังงานสำหรับโรงงานขนาดกลาง',
    en: 'Energy saver for mid-size factories',
    ko: '중소형 공장용 에너지 절약 장치',
  },
  4: {
    th: 'เครื่องประหยัดพลังงานสำหรับโหลดสูง',
    en: 'Energy saver for high loads',
    ko: '고부하용 에너지 절약 장치',
  },
  5: {
    th: 'ชุดเซ็นเซอร์ CT สำหรับการติดตามพลังงาน',
    en: 'CT sensor kit for energy monitoring',
    ko: '에너지 모니터링용 CT 센서 키트',
  },
  6: {
    th: 'เกตเวย์ IoT สำหรับส่งข้อมูลขึ้นคลาวด์',
    en: 'IoT gateway for cloud data transmission',
    ko: '클라우드 데이터 전송용 IoT 게이트웨이',
  },
  7: {
    th: 'มิเตอร์ไฟอัจฉริยะเชื่อมต่อแดชบอร์ดเรียลไทม์',
    en: 'Smart power meter with real-time dashboard',
    ko: '실시간 대시보드 연결 스마트 전력 미터',
  },
};

function getDesc(p: ProductRow, lang: string): string {
  const id = Number(p.id);
  const map = descI18n[id];
  if (map) return map[lang] ?? map.th ?? '';
  return [p.brand, p.model, p.description].filter(Boolean).join(' · ') || '—';
}

export default function ProductsInfoContent() {
  const { locale } = useLocale();
  const { selectedSite } = useSite();
  const lang = ['th', 'ko', 'en'].includes(locale) ? locale : 'th';
  const ui = copy[lang as keyof typeof copy];

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ge-energy/products?limit=200&sortBy=name');
        const json = await res.json();
        if (cancelled) return;
        if (Array.isArray(json?.products)) {
          setProducts(json.products);
        } else if (Array.isArray(json?.data)) {
          setProducts(json.data);
        } else {
          setProducts([]);
        }
      } catch {
        if (!cancelled) setError(ui.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSite, ui.error]);

  return (
    <div className="energy-page max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-emerald-900">{ui.title}</h1>
            <p className="text-sm text-slate-500">{ui.subtitle}</p>
          </div>
        </div>
        <Link
          href="/momoge-product"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
        >
          {ui.momogeLink}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            {ui.loading}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-5 py-8 text-red-600 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">{ui.empty}</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50/80 border-b border-emerald-100 text-left">
                  <th className="px-4 py-3 font-semibold text-emerald-900">{ui.colName}</th>
                  <th className="px-4 py-3 font-semibold text-emerald-900">{ui.colId}</th>
                  <th className="px-4 py-3 font-semibold text-emerald-900">{ui.colNote}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p, i) => (
                  <tr key={String(p.id ?? i)} className="hover:bg-emerald-50/30">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {p.id != null ? String(p.id) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {getDesc(p, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
