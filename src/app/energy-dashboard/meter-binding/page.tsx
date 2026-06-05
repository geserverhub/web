'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link2, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useLocale } from '@/lib/LocaleContext';

type Device = {
  deviceID: number;
  deviceName: string;
  GEsaveID?: string | null;
  location?: string | null;
};

type Meter = {
  meterID: string | number;
  meterNo?: string | null;
  meterType?: string | null;
};

type Binding = {
  id: number;
  device_id: number;
  meter_id: string;
  meter_channel: 'ch1' | 'ch2';
  meter_role: 'input' | 'output';
  deviceName?: string | null;
  GEsaveID?: string | null;
  location?: string | null;
  meterNo?: string | null;
  meterType?: string | null;
};

const COPY = {
  th: {
    badge: 'ผูกมิเตอร์',
    title: 'ผูกเชื่อมต่อมิเตอร์กับเครื่องประหยัดพลังงาน',
    sub: 'เลือกเครื่อง + มิเตอร์ แล้วผูกเป็นชุดเดียวกัน สามารถย้าย/สลับการติดตั้งได้',
    meterList: 'รายชื่อมิเตอร์ที่บันทึกเข้าระบบ',
    deviceList: 'รายชื่อเครื่องประหยัดพลังงาน',
    bindingList: 'รายการการเชื่อมผูก (แก้ไขแบบ Inline)',
    role: 'ประเภทมิเตอร์',
    channel: 'ช่องมิเตอร์',
    ch1: 'CH1',
    ch2: 'CH2',
    input: 'มิเตอร์ INPUT',
    output: 'มิเตอร์ OUTPUT',
    device: 'เครื่องประหยัดพลังงาน',
    meter: 'มิเตอร์',
    action: 'การจัดการ',
    addBinding: 'เพิ่มการเชื่อมผูก',
    refresh: 'รีเฟรช',
    save: 'บันทึก',
    delete: 'ลบ',
    noData: 'ยังไม่มีข้อมูล',
    movedNote: 'หากมิเตอร์ถูกผูกกับเครื่องอื่น ระบบจะย้ายให้อัตโนมัติ',
  },
  en: {
    badge: 'Meter Binding',
    title: 'Bind meters to energy-saving devices',
    sub: 'Bind device + meter as one pair. You can move/swap installations at any time.',
    meterList: 'Registered meters',
    deviceList: 'Energy-saving devices',
    bindingList: 'Binding list (inline edit)',
    role: 'Meter role',
    channel: 'Meter channel',
    ch1: 'CH1',
    ch2: 'CH2',
    input: 'Meter INPUT',
    output: 'Meter OUTPUT',
    device: 'Device',
    meter: 'Meter',
    action: 'Actions',
    addBinding: 'Add binding',
    refresh: 'Refresh',
    save: 'Save',
    delete: 'Delete',
    noData: 'No data',
    movedNote: 'If a meter is already attached to another device, it will be moved automatically.',
  },
  ko: {
    badge: '미터 연결',
    title: '미터를 절감 장치와 연결',
    sub: '장치 + 미터를 한 세트로 연결하고 설치 대상을 자유롭게 이동/교체할 수 있습니다.',
    meterList: '등록된 미터 목록',
    deviceList: '절감 장치 목록',
    bindingList: '연결 목록 (인라인 수정)',
    role: '미터 유형',
    channel: '미터 채널',
    ch1: 'CH1',
    ch2: 'CH2',
    input: '미터 INPUT',
    output: '미터 OUTPUT',
    device: '장치',
    meter: '미터',
    action: '작업',
    addBinding: '연결 추가',
    refresh: '새로고침',
    save: '저장',
    delete: '삭제',
    noData: '데이터 없음',
    movedNote: '이미 다른 장치에 연결된 미터를 선택하면 자동으로 이동됩니다.',
  },
} as const;

function meterLabel(m: Meter) {
  const no = String(m.meterNo || '').trim();
  const id = String(m.meterID || '').trim();
  const type = String(m.meterType || '').trim();
  return [no ? `No.${no}` : '', id ? `ID:${id}` : '', type ? `(${type})` : '']
    .filter(Boolean)
    .join(' ');
}

export default function MeterBindingPage() {
  const { locale } = useLocale();
  const lang = (locale === 'th' || locale === 'ko') ? locale : 'en';
  const t = COPY[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [bindings, setBindings] = useState<Binding[]>([]);

  const [draftDevice, setDraftDevice] = useState<number | ''>('');
  const [draftMeter, setDraftMeter] = useState<string>('');
  const [draftChannel, setDraftChannel] = useState<'ch1' | 'ch2'>('ch1');
  const [draftRole, setDraftRole] = useState<'input' | 'output'>('output');

  const [editing, setEditing] = useState<Record<number, Partial<Binding>>>({});

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ge-energy/meter-device-binding');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Load failed');
      setDevices(json.devices || []);
      setMeters(json.meters || []);
      setBindings(json.bindings || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const meterMap = useMemo(
    () => new Map(meters.map((m) => [String(m.meterID), meterLabel(m)])),
    [meters]
  );

  async function createBinding() {
    if (!draftDevice || !draftMeter) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/ge-energy/meter-device-binding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: Number(draftDevice),
          meterId: draftMeter,
          meterChannel: draftChannel,
          meterRole: draftRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');
      setDraftDevice('');
      setDraftMeter('');
      setDraftChannel('ch1');
      setDraftRole('output');
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function editValue(row: Binding, key: keyof Binding) {
    const rowEdit = editing[row.id] || {};
    return (rowEdit[key] as string | number | undefined) ?? row[key];
  }

  function setEdit(rowId: number, key: keyof Binding, value: string | number) {
    setEditing((prev) => ({ ...prev, [rowId]: { ...(prev[rowId] || {}), [key]: value } }));
  }

  async function saveInline(row: Binding) {
    const payload = {
      id: row.id,
      deviceId: Number(editValue(row, 'device_id')),
      meterId: String(editValue(row, 'meter_id')),
      meterChannel: String(editValue(row, 'meter_channel')),
      meterRole: String(editValue(row, 'meter_role')),
    };
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/ge-energy/meter-device-binding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Update failed');
      setEditing((prev) => {
        const copy = { ...prev };
        delete copy[row.id];
        return copy;
      });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function removeBinding(id: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ge-energy/meter-device-binding?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="energy-page space-y-5">
      <div className="energy-hero">
        <div className="energy-hero-inner px-8 py-8">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Link2 className="w-3.5 h-3.5" /> {t.badge}
          </div>
          <h1 className="text-3xl font-black text-white mb-1">{t.title}</h1>
          <p className="text-cyan-100 text-sm">{t.sub}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-800">{t.addBinding}</h2>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={loadAll}
            disabled={loading || saving}
          >
            <RefreshCw className="w-4 h-4" /> {t.refresh}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{t.movedNote}</p>
        <div className="grid md:grid-cols-5 gap-3">
          <select
            value={draftRole}
            onChange={(e) => setDraftRole(e.target.value as 'input' | 'output')}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50"
          >
            <option value="input">{t.input}</option>
            <option value="output">{t.output}</option>
          </select>
          <select
            value={draftDevice}
            onChange={(e) => setDraftDevice(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50"
          >
            <option value="">{t.device}</option>
            {devices.map((d) => (
              <option key={d.deviceID} value={d.deviceID}>
                {d.deviceName} ({d.GEsaveID || d.deviceID})
              </option>
            ))}
          </select>
          <select
            value={draftMeter}
            onChange={(e) => setDraftMeter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50"
          >
            <option value="">{t.meter}</option>
            {meters.map((m) => (
              <option key={String(m.meterID)} value={String(m.meterID)}>
                {meterLabel(m)}
              </option>
            ))}
          </select>
          <select
            value={draftChannel}
            onChange={(e) => setDraftChannel(e.target.value as 'ch1' | 'ch2')}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50"
          >
            <option value="ch1">{t.channel}: {t.ch1}</option>
            <option value="ch2">{t.channel}: {t.ch2}</option>
          </select>
          <button
            onClick={createBinding}
            disabled={saving || !draftDevice || !draftMeter}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {t.save}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.deviceList}</h3>
          <ul className="space-y-2 max-h-64 overflow-auto">
            {devices.length ? devices.map((d) => (
              <li key={d.deviceID} className="text-sm text-gray-700 border border-gray-100 rounded-lg px-3 py-2">
                <strong>{d.deviceName}</strong> <span className="text-gray-500">({d.GEsaveID || d.deviceID})</span>
              </li>
            )) : <li className="text-sm text-gray-400">{t.noData}</li>}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.meterList}</h3>
          <ul className="space-y-2 max-h-64 overflow-auto">
            {meters.length ? meters.map((m) => (
              <li key={String(m.meterID)} className="text-sm text-gray-700 border border-gray-100 rounded-lg px-3 py-2">
                {meterLabel(m)}
              </li>
            )) : <li className="text-sm text-gray-400">{t.noData}</li>}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.bindingList}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{t.role}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{t.channel}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{t.device}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{t.meter}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {bindings.length ? bindings.map((b) => (
                <tr key={b.id} className="border-b border-gray-100">
                  <td className="px-3 py-2">
                    <select
                      value={String(editValue(b, 'meter_role'))}
                      onChange={(e) => setEdit(b.id, 'meter_role', e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="input">{t.input}</option>
                      <option value="output">{t.output}</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={String(editValue(b, 'meter_channel'))}
                      onChange={(e) => setEdit(b.id, 'meter_channel', e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="ch1">{t.ch1}</option>
                      <option value="ch2">{t.ch2}</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={Number(editValue(b, 'device_id'))}
                      onChange={(e) => setEdit(b.id, 'device_id', Number(e.target.value))}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm w-full"
                    >
                      {devices.map((d) => (
                        <option key={d.deviceID} value={d.deviceID}>
                          {d.deviceName} ({d.GEsaveID || d.deviceID})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={String(editValue(b, 'meter_id'))}
                      onChange={(e) => setEdit(b.id, 'meter_id', e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm w-full"
                    >
                      {meters.map((m) => (
                        <option key={String(m.meterID)} value={String(m.meterID)}>
                          {meterMap.get(String(m.meterID)) || String(m.meterID)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                        onClick={() => saveInline(b)}
                        disabled={saving}
                      >
                        <Save className="w-3.5 h-3.5" /> {t.save}
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                        onClick={() => removeBinding(b.id)}
                        disabled={saving}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-sm text-gray-400 text-center">{t.noData}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
