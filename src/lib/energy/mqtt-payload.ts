/** Canonical MQTT telemetry JSON for T310 / GE Energy gateways. */
export const GE_MQTT_PAYLOAD_EXAMPLE = {
  device_id: 5,
  geID: 'GE-TH-001',
  record_time: '2026-05-22T14:30:00',
  before_L1: 230.1,
  before_L2: 229.8,
  before_L3: 231.0,
  metrics_L1: 228.5,
  metrics_L2: 228.2,
  metrics_L3: 229.1,
  before_P: 12.5,
  metrics_P: 9.8,
  before_kWh: 12345.6,
  metrics_kWh: 12340.1,
  before_THD: 3.2,
  after_THD: 1.8,
} as const;
