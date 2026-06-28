'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import { GE_MQTT_PAYLOAD_EXAMPLE } from '@/lib/energy/mqtt-payload';
import AiTokenSettingsCard from '@/components/energy/AiTokenSettingsCard';
import {
  AlertCircle,
  Cable,
  CheckCircle,
  Copy,
  Edit2,
  Radio,
  RefreshCw,
  Save,
  Server,
  Workflow,
  X,
} from 'lucide-react';

type EnergyUser = { userId?: number | string; username?: string; site?: string };

type MqttSettings = {
  host: string;
  port: number;
  username: string;
  password: string;
  topic: string;
  topic_prefix: string;
  interval: number;
  gateway_model: string;
  serial_port: string;
  baud_rate: number;
  parity: string;
  data_bits: number;
  stop_bits: number;
};

type DeviceConnectivity = {
  device_id: number;
  deviceName?: string;
  GEsaveID?: string;
  site?: string;
  location?: string;
  ipAddress?: string;
  beforeMeterNo?: string;
  metricsMeterNo?: string;
  gateway_model?: string;
  serial_port?: string;
  baud_rate?: number;
  parity?: string;
  data_bits?: number;
  stop_bits?: number;
  slave_before?: number;
  slave_metrics?: number;
  reg_v_l1?: number;
  reg_v_l2?: number;
  reg_v_l3?: number;
  scale_voltage?: number;
  mqtt_topic?: string | null;
  publish_interval_sec?: number;
  enabled?: boolean | number;
  notes?: string | null;
  configured?: boolean | number;
  last_seen_at?: string | null;
  online_status?: number | null;
  last_record_id?: number | null;
};

const COPY = {
  th: {
    lastSeen: 'รับข้อมูลล่าสุด',
    online: 'ออนไลน์',
    offline: 'ออฟไลน์',
    never: 'ยังไม่รับ',
    badge: 'การเชื่อมต่ออุปกรณ์',
    title: 'ตั้งค่าการเชื่อมต่อ Gateway / MQTT / RS485',
    subtitle: 'MQTT Broker, Gateway T310, Modbus RTU และการตั้งค่ารายอุปกรณ์',
    mqttSection: 'MQTT Broker',
    gatewaySection: 'Gateway RS485 (ค่าเริ่มต้นไซต์)',
    devicesSection: 'อุปกรณ์รายเครื่อง',
    host: 'MQTT Host',
    port: 'พอร์ต',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    topicPrefix: 'Topic prefix',
    defaultTopic: 'Topic เริ่มต้น (ทั้งไซต์)',
    interval: 'ช่วงส่งข้อมูล (วินาที)',
    gatewayModel: 'รุ่น Gateway',
    serialPort: 'Serial port',
    baud: 'Baud rate',
    parity: 'Parity',
    dataBits: 'Data bits',
    stopBits: 'Stop bits',
    saveMqtt: 'บันทึก MQTT / Gateway',
    device: 'อุปกรณ์',
    GEsaveID: 'GE ID',
    slaves: 'Slave ก่อน/หลัง',
    topic: 'MQTT Topic',
    status: 'สถานะ',
    actions: 'จัดการ',
    configured: 'ตั้งค่าแล้ว',
    notConfigured: 'ยังไม่ตั้งค่า',
    enabled: 'เปิดใช้งาน',
    disabled: 'ปิด',
    edit: 'แก้ไข',
    modalTitle: 'ตั้งค่าการเชื่อมต่ออุปกรณ์',
    slaveBefore: 'Slave ก่อนติด GE (before_*)',
    slaveMetrics: 'Slave หลังติด GE (metrics_*)',
    regL1: 'Register V L1',
    regL2: 'Register V L2',
    regL3: 'Register V L3',
    scaleV: 'Scale แรงดัน (หาร)',
    publishInterval: 'ช่วง publish (วินาที)',
    notes: 'หมายเหตุ',
    scriptPreview: 'ตัวอย่าง Topic / Payload (before_THD + after_THD)',
    payloadNote: 'after_THD บันทึกเป็น metrics_THD ใน DB',
    saveDevice: 'บันทึกอุปกรณ์',
    cancel: 'ยกเลิก',
    copyOk: 'คัดลอกแล้ว',
    saving: 'กำลังบันทึก…',
    refresh: 'รีเฟรช',
    noDevices: 'ไม่พบอุปกรณ์ในไซต์นี้',
    loginRequired: 'กรุณาเข้าสู่ระบบใหม่',
    bridgeTitle: 'MQTT Bridge (goeunserverhub)',
    bridgeHint:
      'รันบริการ bridge แยกจากเว็บ — รับ MQTT แล้วบันทึกลง power_records อัตโนมัติ',
    bridgeCommand: 'คำสั่งรัน',
    bridgeSubscribe: 'Subscribe pattern',
  },
  en: {
    lastSeen: 'Last seen',
    online: 'Online',
    offline: 'Offline',
    never: 'Never',
    badge: 'Device connectivity',
    title: 'Gateway / MQTT / RS485 settings',
    subtitle: 'MQTT broker, T310 gateway defaults, Modbus RTU and per-device config',
    mqttSection: 'MQTT broker',
    gatewaySection: 'RS485 gateway (site defaults)',
    devicesSection: 'Per-device settings',
    host: 'MQTT host',
    port: 'Port',
    username: 'Username',
    password: 'Password',
    topicPrefix: 'Topic prefix',
    defaultTopic: 'Default topic (site)',
    interval: 'Publish interval (seconds)',
    gatewayModel: 'Gateway model',
    serialPort: 'Serial port',
    baud: 'Baud rate',
    parity: 'Parity',
    dataBits: 'Data bits',
    stopBits: 'Stop bits',
    saveMqtt: 'Save MQTT / gateway',
    device: 'Device',
    GEsaveID: 'GE ID',
    slaves: 'Before / after slave',
    topic: 'MQTT topic',
    status: 'Status',
    actions: 'Actions',
    configured: 'Configured',
    notConfigured: 'Not set',
    enabled: 'Enabled',
    disabled: 'Disabled',
    edit: 'Edit',
    modalTitle: 'Device connectivity',
    slaveBefore: 'Slave before GE (before_*)',
    slaveMetrics: 'Slave after GE (metrics_*)',
    regL1: 'Register V L1',
    regL2: 'Register V L2',
    regL3: 'Register V L3',
    scaleV: 'Voltage scale (divider)',
    publishInterval: 'Publish interval (sec)',
    notes: 'Notes',
    scriptPreview: 'Topic / payload preview (before_THD + after_THD)',
    payloadNote: 'after_THD is stored as metrics_THD in the database',
    saveDevice: 'Save device',
    cancel: 'Cancel',
    copyOk: 'Copied',
    saving: 'Saving…',
    refresh: 'Refresh',
    noDevices: 'No devices for this site',
    loginRequired: 'Please sign in again',
    bridgeTitle: 'MQTT Bridge (goeunserverhub)',
    bridgeHint: 'Run the bridge as a separate process — ingests MQTT into power_records.',
    bridgeCommand: 'Run command',
    bridgeSubscribe: 'Subscribe pattern',
  },
  ko: {
    lastSeen: '마지막 수신',
    online: '온라인',
    offline: '오프라인',
    never: '수신 없음',
    badge: '장치 연결',
    title: 'Gateway / MQTT / RS485 설정',
    subtitle: 'MQTT 브로커, T310 게이트웨이, Modbus RTU 및 장치별 설정',
    mqttSection: 'MQTT 브로커',
    gatewaySection: 'RS485 게이트웨이 (사이트 기본값)',
    devicesSection: '장치별 설정',
    host: 'MQTT 호스트',
    port: '포트',
    username: '사용자명',
    password: '비밀번호',
    topicPrefix: 'Topic prefix',
    defaultTopic: '기본 topic (사이트)',
    interval: '전송 간격 (초)',
    gatewayModel: '게이트웨이 모델',
    serialPort: 'Serial port',
    baud: 'Baud rate',
    parity: 'Parity',
    dataBits: 'Data bits',
    stopBits: 'Stop bits',
    saveMqtt: 'MQTT/게이트웨이 저장',
    device: '장치',
    GEsaveID: 'GE ID',
    slaves: 'Before/after slave',
    topic: 'MQTT topic',
    status: '상태',
    actions: '작업',
    configured: '설정됨',
    notConfigured: '미설정',
    enabled: '사용',
    disabled: '사용 안 함',
    edit: '편집',
    modalTitle: '장치 연결 설정',
    slaveBefore: 'GE 설치 전 slave (before_*)',
    slaveMetrics: 'GE 설치 후 slave (metrics_*)',
    regL1: 'Register V L1',
    regL2: 'Register V L2',
    regL3: 'Register V L3',
    scaleV: '전압 scale (나누기)',
    publishInterval: 'Publish 간격 (초)',
    notes: '메모',
    scriptPreview: 'Topic / payload 미리보기 (before_THD + after_THD)',
    payloadNote: 'after_THD는 DB의 metrics_THD로 저장됩니다',
    saveDevice: '장치 저장',
    cancel: '취소',
    copyOk: '복사됨',
    saving: '저장 중…',
    refresh: '새로고침',
    noDevices: '이 사이트에 장치가 없습니다',
    loginRequired: '다시 로그인하세요',
    bridgeTitle: 'MQTT Bridge (goeunserverhub)',
    bridgeHint: '웹과 별도로 bridge를 실행하면 MQTT가 power_records에 저장됩니다.',
    bridgeCommand: '실행 명령',
    bridgeSubscribe: 'Subscribe pattern',
  },
};

type BridgeStatus = {
  bridge_command?: string;
  profiles?: { site: string; pattern: string; host: string; port: number }[];
  env_fallback?: { host: string; port: number; pattern: string } | null;
};

const defaultMqtt = (): MqttSettings => ({
  host: 'broker.example.com',
  port: 1883,
  username: '',
  password: '********',
  topic: '',
  topic_prefix: 'ge',
  interval: 30,
  gateway_model: 'T310',
  serial_port: '/dev/ttyS1',
  baud_rate: 9600,
  parity: 'none',
  data_bits: 8,
  stop_bits: 1,
});

function buildTopic(
  prefix: string,
  _site: string,
  deviceId: number,
  GEsaveID?: string,
  custom?: string | null
) {
  if (custom?.trim()) return custom.trim();
  const id = GEsaveID || String(deviceId);
  return `${prefix}/${id}`;
}

function buildPayloadPreview(deviceId: number, GEsaveID?: string) {
  return JSON.stringify(
    {
      ...GE_MQTT_PAYLOAD_EXAMPLE,
      device_id: deviceId,
      GEsaveID: GEsaveID || GE_MQTT_PAYLOAD_EXAMPLE.GEsaveID,
      record_time: new Date().toISOString().slice(0, 19),
    },
    null,
    2
  );
}

function fmtLastSeen(dt: string | null | undefined): string {
  if (!dt) return '';
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '< 1 min';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isOnline(d: DeviceConnectivity): boolean {
  if (!d.last_seen_at) return false;
  return Date.now() - new Date(d.last_seen_at).getTime() < 10 * 60 * 1000; // 10 min
}

export default function DeviceConnectivityPage() {
  const { selectedSite } = useSite();
  const { locale } = useLocale();
  const ui = COPY[locale as keyof typeof COPY] ?? COPY.en;

  const [user, setUser] = useState<EnergyUser | null>(null);
  const [mqtt, setMqtt] = useState<MqttSettings>(defaultMqtt);
  const [devices, setDevices] = useState<DeviceConnectivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMqtt, setSavingMqtt] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeviceConnectivity | null>(null);
  const [savingDevice, setSavingDevice] = useState(false);
  const [copyHint, setCopyHint] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('energy_system_user');
      setUser(raw ? (JSON.parse(raw) as EnergyUser) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [mqttRes, devRes, bridgeRes] = await Promise.all([
        fetch(`/api/ge-energy/mqtt-settings?userId=1&site=${selectedSite}`),
        fetch(`/api/ge-energy/device-connectivity?site=${selectedSite}`),
        fetch('/api/ge-energy/mqtt-bridge/status'),
      ]);
      const mqttJson = await mqttRes.json();
      const devJson = await devRes.json();
      const bridgeJson = await bridgeRes.json();
      if (bridgeJson.success) {
        setBridgeStatus(bridgeJson);
      }
      if (mqttJson.success && mqttJson.settings) {
        setMqtt({ ...defaultMqtt(), ...mqttJson.settings });
      }
      if (devJson.success) {
        setDevices(devJson.devices || []);
      } else {
        setStatus({ type: 'error', message: devJson.error || 'Failed to load devices' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error' });
    } finally {
      setLoading(false);
    }
  }, [user?.userId, selectedSite]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const configuredCount = useMemo(
    () => devices.filter((d) => d.configured).length,
    [devices]
  );

  async function saveMqttSettings() {
    setSavingMqtt(true);
    setStatus(null);
    try {
      const res = await fetch('/api/ge-energy/mqtt-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          site: selectedSite,
          ...mqtt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: data.message || 'Saved' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Save failed' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error' });
    } finally {
      setSavingMqtt(false);
    }
  }

  function openEdit(device: DeviceConnectivity) {
    setEditing({
      ...device,
      gateway_model: device.gateway_model ?? mqtt.gateway_model,
      serial_port: device.serial_port ?? mqtt.serial_port,
      baud_rate: device.baud_rate ?? mqtt.baud_rate,
      parity: device.parity ?? mqtt.parity,
      data_bits: device.data_bits ?? mqtt.data_bits,
      stop_bits: device.stop_bits ?? mqtt.stop_bits,
      slave_before: device.slave_before ?? Number(device.beforeMeterNo || 1),
      slave_metrics: device.slave_metrics ?? Number(device.metricsMeterNo || 2),
      reg_v_l1: device.reg_v_l1 ?? 0,
      reg_v_l2: device.reg_v_l2 ?? 2,
      reg_v_l3: device.reg_v_l3 ?? 4,
      scale_voltage: device.scale_voltage ?? 10,
      publish_interval_sec: device.publish_interval_sec ?? mqtt.interval,
      enabled: device.enabled !== 0 && device.enabled !== false,
      mqtt_topic:
        device.mqtt_topic ??
        buildTopic(mqtt.topic_prefix, selectedSite, device.device_id, device.GEsaveID),
    });
    setModalOpen(true);
  }

  async function saveDevice() {
    if (!editing?.device_id) return;
    setSavingDevice(true);
    try {
      const res = await fetch('/api/ge-energy/device-connectivity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: editing.device_id,
          gateway_model: editing.gateway_model,
          serial_port: editing.serial_port,
          baud_rate: editing.baud_rate,
          parity: editing.parity,
          data_bits: editing.data_bits,
          stop_bits: editing.stop_bits,
          slave_before: editing.slave_before,
          slave_metrics: editing.slave_metrics,
          beforeMeterNo: String(editing.slave_before ?? 1),
          metricsMeterNo: String(editing.slave_metrics ?? 2),
          reg_v_l1: editing.reg_v_l1,
          reg_v_l2: editing.reg_v_l2,
          reg_v_l3: editing.reg_v_l3,
          scale_voltage: editing.scale_voltage,
          mqtt_topic: editing.mqtt_topic,
          publish_interval_sec: editing.publish_interval_sec,
          enabled: editing.enabled,
          notes: editing.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setEditing(null);
        setStatus({ type: 'success', message: data.message || 'Device saved' });
        loadAll();
      } else {
        setStatus({ type: 'error', message: data.error || 'Save failed' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error' });
    } finally {
      setSavingDevice(false);
    }
  }

  const previewTopic = editing
    ? buildTopic(
        mqtt.topic_prefix,
        selectedSite,
        editing.device_id,
        editing.GEsaveID,
        editing.mqtt_topic
      )
    : '';

  const previewPayload = editing
    ? buildPayloadPreview(editing.device_id, editing.GEsaveID)
    : '';

  function copyPreview() {
    const text = `Topic: ${previewTopic}\n\n${previewPayload}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyHint(true);
      setTimeout(() => setCopyHint(false), 2000);
    });
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none';

  return (
    <div className="energy-page space-y-5">
      <div className="energy-hero">
        <div className="energy-hero-inner px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Cable className="w-3.5 h-3.5" /> {ui.badge}
            </div>
            <h1 className="text-3xl font-black text-white mb-1">{ui.title}</h1>
            <p className="text-emerald-100 text-sm">{ui.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
              <Radio className="w-4 h-4 text-white/70 mb-1" />
              <span className="text-2xl font-black text-white leading-none">{configuredCount}</span>
              <span className="text-emerald-100 text-xs mt-0.5">/ {devices.length}</span>
            </div>
            <button
              type="button"
              onClick={loadAll}
              className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {ui.refresh}
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {status.message}
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 text-slate-100">
        <div className="flex items-start gap-3">
          <Workflow className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white">{ui.bridgeTitle}</h2>
            <p className="text-sm text-slate-300 mt-1">{ui.bridgeHint}</p>
            <p className="text-xs text-slate-400 mt-2">
              {ui.bridgeCommand}:{' '}
              <code className="text-emerald-300">{bridgeStatus?.bridge_command || 'npm run mqtt:bridge'}</code>
            </p>
            {(bridgeStatus?.profiles?.length ?? 0) > 0 ? (
              <ul className="mt-2 space-y-1 text-xs font-mono text-slate-300">
                {bridgeStatus?.profiles?.map((p) => (
                  <li key={p.site}>
                    {ui.bridgeSubscribe} [{p.site}]: {p.pattern} → {p.host}:{p.port}
                  </li>
                ))}
              </ul>
            ) : bridgeStatus?.env_fallback ? (
              <p className="mt-2 text-xs font-mono text-slate-300">
                {ui.bridgeSubscribe}: {bridgeStatus.env_fallback.pattern} →{' '}
                {bridgeStatus.env_fallback.host}:{bridgeStatus.env_fallback.port}
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-300">
                บันทึก MQTT ด้านล่างก่อน แล้วรัน bridge บนเซิร์ฟเวอร์
              </p>
            )}
          </div>
        </div>
      </div>

      <AiTokenSettingsCard locale={locale} />

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-emerald-600" />
            {ui.mqttSection}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-gray-500">{ui.host}</span>
              <input
                className={inputClass}
                value={mqtt.host}
                onChange={(e) => setMqtt((m) => ({ ...m, host: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.port}</span>
              <input
                type="number"
                className={inputClass}
                value={mqtt.port}
                onChange={(e) => setMqtt((m) => ({ ...m, port: Number(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.interval}</span>
              <input
                type="number"
                className={inputClass}
                value={mqtt.interval}
                onChange={(e) => setMqtt((m) => ({ ...m, interval: Number(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.username}</span>
              <input
                className={inputClass}
                value={mqtt.username}
                onChange={(e) => setMqtt((m) => ({ ...m, username: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.password}</span>
              <input
                type="password"
                className={inputClass}
                value={mqtt.password}
                onChange={(e) => setMqtt((m) => ({ ...m, password: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.topicPrefix}</span>
              <input
                className={inputClass}
                value={mqtt.topic_prefix}
                onChange={(e) => setMqtt((m) => ({ ...m, topic_prefix: e.target.value }))}
                placeholder="ge"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-gray-500">{ui.defaultTopic}</span>
              <input
                className={inputClass}
                value={mqtt.topic}
                onChange={(e) => setMqtt((m) => ({ ...m, topic: e.target.value }))}
                placeholder={`${mqtt.topic_prefix}/${selectedSite}/+/telemetry`}
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Cable className="h-5 w-5 text-emerald-600" />
            {ui.gatewaySection}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.gatewayModel}</span>
              <input
                className={inputClass}
                value={mqtt.gateway_model}
                onChange={(e) => setMqtt((m) => ({ ...m, gateway_model: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.serialPort}</span>
              <input
                className={inputClass}
                value={mqtt.serial_port}
                onChange={(e) => setMqtt((m) => ({ ...m, serial_port: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.baud}</span>
              <input
                type="number"
                className={inputClass}
                value={mqtt.baud_rate}
                onChange={(e) => setMqtt((m) => ({ ...m, baud_rate: Number(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.parity}</span>
              <select
                className={inputClass}
                value={mqtt.parity}
                onChange={(e) => setMqtt((m) => ({ ...m, parity: e.target.value }))}
              >
                <option value="none">none</option>
                <option value="even">even</option>
                <option value="odd">odd</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.dataBits}</span>
              <input
                type="number"
                className={inputClass}
                value={mqtt.data_bits}
                onChange={(e) => setMqtt((m) => ({ ...m, data_bits: Number(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{ui.stopBits}</span>
              <input
                type="number"
                className={inputClass}
                value={mqtt.stop_bits}
                onChange={(e) => setMqtt((m) => ({ ...m, stop_bits: Number(e.target.value) }))}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Modbus RTU: 9600 8N1 · Slave 1 → before_L1/L2/L3 · Slave 2 → metrics_L1/L2/L3
          </p>
          <button
            type="button"
            disabled={savingMqtt}
            onClick={saveMqttSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingMqtt ? ui.saving : ui.saveMqtt}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{ui.devicesSection}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{ui.device}</th>
                <th className="px-4 py-3">{ui.GEsaveID}</th>
                <th className="px-4 py-3">{ui.slaves}</th>
                <th className="px-4 py-3">{ui.topic}</th>
                <th className="px-4 py-3">{ui.lastSeen}</th>
                <th className="px-4 py-3">{ui.status}</th>
                <th className="px-4 py-3">{ui.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    …
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {ui.noDevices}
                  </td>
                </tr>
              ) : (
                devices.map((d) => {
                  const topic = buildTopic(
                    mqtt.topic_prefix,
                    selectedSite,
                    d.device_id,
                    d.GEsaveID,
                    d.mqtt_topic
                  );
                  const isOn = d.enabled !== 0 && d.enabled !== false;
                  const online = isOnline(d);
                  const lastSeen = fmtLastSeen(d.last_seen_at);
                  return (
                    <tr key={d.device_id} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {d.deviceName || `#${d.device_id}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-700">{d.GEsaveID || '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {d.slave_before ?? d.beforeMeterNo ?? 1} / {d.slave_metrics ?? d.metricsMeterNo ?? 2}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[180px] truncate">
                        {topic}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : d.last_seen_at ? 'bg-gray-300' : 'bg-gray-200'}`} />
                          <span className="text-xs text-gray-500">
                            {lastSeen || ui.never}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${online ? 'bg-emerald-100 text-emerald-800' : d.configured ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'}`}>
                            {online ? ui.online : d.configured ? ui.offline : ui.notConfigured}
                          </span>
                          {d.configured && (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${isOn ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                              {isOn ? ui.enabled : ui.disabled}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          {ui.edit}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">{ui.modalTitle}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                <strong>{editing.deviceName}</strong> · GE ID: {editing.GEsaveID || '—'} · Device ID:{' '}
                {editing.device_id}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">{ui.slaveBefore}</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={editing.slave_before ?? 1}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, slave_before: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">{ui.slaveMetrics}</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={editing.slave_metrics ?? 2}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, slave_metrics: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">{ui.regL1}</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={editing.reg_v_l1 ?? 0}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, reg_v_l1: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">{ui.regL2}</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={editing.reg_v_l2 ?? 2}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, reg_v_l2: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">{ui.regL3}</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={editing.reg_v_l3 ?? 4}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, reg_v_l3: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">{ui.scaleV}</span>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={editing.scale_voltage ?? 10}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, scale_voltage: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-gray-500">{ui.topic}</span>
                  <input
                    className={inputClass}
                    value={editing.mqtt_topic ?? ''}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, mqtt_topic: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">{ui.publishInterval}</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={editing.publish_interval_sec ?? 30}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, publish_interval_sec: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={editing.enabled !== false && editing.enabled !== 0}
                    onChange={(e) =>
                      setEditing((x) => x && { ...x, enabled: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-700">{ui.enabled}</span>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-gray-500">{ui.notes}</span>
                  <textarea
                    className={`${inputClass} min-h-[72px]`}
                    value={editing.notes ?? ''}
                    onChange={(e) => setEditing((x) => x && { ...x, notes: e.target.value })}
                  />
                </label>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">{ui.scriptPreview}</span>
                  <button
                    type="button"
                    onClick={copyPreview}
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copyHint ? ui.copyOk : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-800 break-all mb-2">{previewTopic}</p>
                <p className="text-[10px] text-gray-500 mb-2">{ui.payloadNote}</p>
                <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {previewPayload}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
              >
                {ui.cancel}
              </button>
              <button
                type="button"
                disabled={savingDevice}
                onClick={saveDevice}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {savingDevice ? ui.saving : ui.saveDevice}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
