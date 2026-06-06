'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import { Receipt, Save, RotateCcw, Loader2, User, Gauge, Check, AlertCircle } from 'lucide-react';

type DeviceRow = {
  deviceID: string;
  deviceName: string;
  GEsaveID?: string;
  customerName?: string;
  customer_id?: number | null;
  location?: string;
  record_scope?: string;
};

type BillRow = {
  billMonth: string; // YYYY-MM
  energyKwh: string;
  billCost: string;
  peakKw: string;
  peakCost: string;
};

const L = {
  th: {
    title: 'กรอกข้อมูลบิลค่าไฟย้อนหลัง 1 ปี',
    subtitle: 'บันทึกบิลค่าไฟ 12 เดือนของมิเตอร์ (โดยเฉพาะมิเตอร์ก่อนติดตั้ง) เพื่อใช้พ่วงข้อมูลในการวิเคราะห์',
    selectMeter: 'เลือกมิเตอร์',
    chooseMeter: '— เลือกมิเตอร์ —',
    customer: 'ลูกค้า',
    breaker: 'ขนาดเบรคเกอร์ (A)',
    breakerPh: 'เช่น 125',
    note: 'หมายเหตุ',
    notePh: 'หมายเหตุเพิ่มเติม',
    month: 'เดือน',
    kwh: 'ปริมาณการใช้ไฟ (kWh)',
    cost: 'ค่าไฟ',
    peakKw: 'ดีมานด์ช่วง Peak (kW)',
    peakCost: 'ค่าไฟช่วง Peak',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    reset: 'ล้างฟอร์ม',
    fill12: 'สร้าง 12 เดือนล่าสุด',
    saved: '✓ บันทึกบิลค่าไฟแล้ว',
    error: 'เกิดข้อผิดพลาด',
    selectFirst: 'กรุณาเลือกมิเตอร์ก่อน',
    preInstall: 'ก่อนติดตั้ง',
    noCustomer: 'ยังไม่ผูกลูกค้า',
    total: 'รวมทั้งปี',
  },
  en: {
    title: 'Enter 1-Year Historical Electricity Bills',
    subtitle: 'Record 12 months of bills per meter (esp. pre-install meters) to feed the analysis.',
    selectMeter: 'Select meter',
    chooseMeter: '— Select a meter —',
    customer: 'Customer',
    breaker: 'Breaker size (A)',
    breakerPh: 'e.g. 125',
    note: 'Note',
    notePh: 'Optional note',
    month: 'Month',
    kwh: 'Usage (kWh)',
    cost: 'Bill cost',
    peakKw: 'Peak demand (kW)',
    peakCost: 'Peak charge',
    save: 'Save',
    saving: 'Saving...',
    reset: 'Reset',
    fill12: 'Fill last 12 months',
    saved: '✓ Bills saved',
    error: 'Something went wrong',
    selectFirst: 'Please select a meter first',
    preInstall: 'pre-install',
    noCustomer: 'No customer linked',
    total: 'Year total',
  },
  ko: {
    title: '최근 1년 전기요금 청구 데이터 입력',
    subtitle: '미터(특히 설치 전 미터)별 12개월 청구 내역을 기록하여 분석에 활용합니다.',
    selectMeter: '미터 선택',
    chooseMeter: '— 미터 선택 —',
    customer: '고객',
    breaker: '차단기 용량 (A)',
    breakerPh: '예: 125',
    note: '비고',
    notePh: '추가 메모',
    month: '월',
    kwh: '사용량 (kWh)',
    cost: '요금',
    peakKw: '피크 수요 (kW)',
    peakCost: '피크 요금',
    save: '저장',
    saving: '저장 중...',
    reset: '초기화',
    fill12: '최근 12개월 생성',
    saved: '✓ 청구 데이터 저장됨',
    error: '오류가 발생했습니다',
    selectFirst: '먼저 미터를 선택하세요',
    preInstall: '설치 전',
    noCustomer: '연결된 고객 없음',
    total: '연간 합계',
  },
};

function last12Months(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 11; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function emptyRows(): BillRow[] {
  return last12Months().map((billMonth) => ({
    billMonth,
    energyKwh: '',
    billCost: '',
    peakKw: '',
    peakCost: '',
  }));
}

export default function BillHistoryPage() {
  const { selectedSite } = useSite();
  const { locale } = useLocale();
  const t = L[(['th', 'en', 'ko'].includes(locale) ? locale : 'th') as 'th' | 'en' | 'ko'];

  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [breaker, setBreaker] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<BillRow[]>(emptyRows());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const selectedInfo = useMemo(
    () => devices.find((d) => d.deviceID === selectedDevice),
    [devices, selectedDevice],
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/ge-energy/devices-setting?site=all', { cache: 'no-store' });
        const json = await res.json();
        const list = (json.devices ?? json.data ?? []) as Array<Record<string, unknown>>;
        setDevices(
          list.map((d) => ({
            deviceID: String(d.deviceID ?? ''),
            deviceName: String(d.deviceName ?? d.deviceID ?? ''),
            GEsaveID: d.GEsaveID as string | undefined,
            customerName: d.customerName as string | undefined,
            customer_id: d.customer_id as number | null | undefined,
            location: d.location as string | undefined,
            record_scope: d.record_scope as string | undefined,
          })),
        );
      } catch {
        setDevices([]);
      }
    })();
  }, [selectedSite]);

  const loadBills = useCallback(async (deviceId: string) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/ge-energy/bill-history?deviceId=${encodeURIComponent(deviceId)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      const existing = Array.isArray(json.bills) ? json.bills : [];
      if (existing.length) {
        const byMonth = new Map<string, BillRow>();
        for (const b of existing) {
          const ym = String(b.billMonth).slice(0, 7);
          byMonth.set(ym, {
            billMonth: ym,
            energyKwh: b.energyKwh != null ? String(b.energyKwh) : '',
            billCost: b.billCost != null ? String(b.billCost) : '',
            peakKw: b.peakKw != null ? String(b.peakKw) : '',
            peakCost: b.peakCost != null ? String(b.peakCost) : '',
          });
        }
        const merged = emptyRows().map((r) => byMonth.get(r.billMonth) ?? r);
        // Include any saved months outside the default last-12 window.
        for (const [ym, row] of byMonth) {
          if (!merged.some((m) => m.billMonth === ym)) merged.push(row);
        }
        merged.sort((a, b) => a.billMonth.localeCompare(b.billMonth));
        setRows(merged);
      } else {
        setRows(emptyRows());
      }
      setBreaker(json.breakerSizeAmp != null ? String(json.breakerSizeAmp) : '');
    } catch {
      setRows(emptyRows());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDevice) loadBills(selectedDevice);
    else {
      setRows(emptyRows());
      setBreaker('');
      setNote('');
    }
  }, [selectedDevice, loadBills]);

  const updateRow = (idx: number, field: keyof BillRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const totals = useMemo(() => {
    const sum = (key: keyof BillRow) =>
      rows.reduce((acc, r) => acc + (parseFloat(r[key]) || 0), 0);
    return { kwh: sum('energyKwh'), cost: sum('billCost') };
  }, [rows]);

  const save = async () => {
    if (!selectedDevice) {
      setMsg({ type: 'err', text: t.selectFirst });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/ge-energy/bill-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: Number(selectedDevice),
          customerId: selectedInfo?.customer_id ?? null,
          site: selectedSite,
          breakerSizeAmp: breaker ? Number(breaker) : null,
          note,
          rows: rows.map((r) => ({
            billMonth: r.billMonth,
            energyKwh: r.energyKwh === '' ? null : Number(r.energyKwh),
            billCost: r.billCost === '' ? null : Number(r.billCost),
            peakKw: r.peakKw === '' ? null : Number(r.peakKw),
            peakCost: r.peakCost === '' ? null : Number(r.peakCost),
          })),
        }),
      });
      const json = await res.json();
      if (json.success) setMsg({ type: 'ok', text: t.saved });
      else setMsg({ type: 'err', text: json.error || t.error });
    } catch {
      setMsg({ type: 'err', text: t.error });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          <Receipt className="h-3.5 w-3.5" /> {t.title}
        </div>
        <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">{t.selectMeter}</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t.chooseMeter}</option>
              {devices.map((d) => (
                <option key={d.deviceID} value={d.deviceID}>
                  {d.deviceName} · {d.GEsaveID || d.deviceID}
                  {d.record_scope === 'pre_install' ? ` (${t.preInstall})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">{t.customer}</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              <span className={selectedInfo?.customerName ? 'text-slate-800' : 'text-slate-400'}>
                {selectedInfo?.customerName || t.noCustomer}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">
              <Gauge className="mr-1 inline h-3.5 w-3.5" />
              {t.breaker}
            </label>
            <input
              type="number"
              value={breaker}
              onChange={(e) => setBreaker(e.target.value)}
              placeholder={t.breakerPh}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-50 text-left text-xs font-bold text-emerald-800">
                <th className="border border-emerald-100 px-3 py-2">{t.month}</th>
                <th className="border border-emerald-100 px-3 py-2">{t.kwh}</th>
                <th className="border border-emerald-100 px-3 py-2">{t.cost}</th>
                <th className="border border-emerald-100 px-3 py-2">{t.peakKw}</th>
                <th className="border border-emerald-100 px-3 py-2">{t.peakCost}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.billMonth + idx} className={idx % 2 ? 'bg-slate-50/50' : ''}>
                  <td className="border border-slate-200 px-2 py-1.5">
                    <input
                      type="month"
                      value={r.billMonth}
                      onChange={(e) => updateRow(idx, 'billMonth', e.target.value)}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                    />
                  </td>
                  {(['energyKwh', 'billCost', 'peakKw', 'peakCost'] as const).map((field) => (
                    <td key={field} className="border border-slate-200 px-2 py-1.5">
                      <input
                        type="number"
                        value={r[field]}
                        onChange={(e) => updateRow(idx, field, e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-right text-xs focus:ring-1 focus:ring-emerald-400"
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50/60 font-bold text-emerald-800">
                <td className="border border-emerald-100 px-3 py-2">{t.total}</td>
                <td className="border border-emerald-100 px-3 py-2 text-right">
                  {totals.kwh.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </td>
                <td className="border border-emerald-100 px-3 py-2 text-right">
                  {totals.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </td>
                <td className="border border-emerald-100 px-3 py-2" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-bold text-slate-500">{t.note}</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePh}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {msg && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
              msg.type === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}
          >
            {msg.type === 'ok' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={save}
            disabled={saving || loading || !selectedDevice}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t.saving : t.save}
          </button>
          <button
            onClick={() => {
              setRows(emptyRows());
              setNote('');
              setMsg(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            {t.fill12}
          </button>
        </div>
      </div>
    </div>
  );
}
