/**
 * Canonical MQTT telemetry JSON for T310 / GE Energy gateways (EM4374 meter, CH1+CH2).
 * Full parameter set per channel: V (L1-3), A/current (L1-3), kWh, P (kW), Q (kvar),
 * S (kVA), PF, THD, F (Hz) — matches power_records columns and t310-config-mqtt.json.
 * CT ratio 250A/5A (meter's configured primary rating) — current_L* values are the
 * primary-side amps the CT reports, not the 5A secondary.
 */
export const GE_MQTT_PAYLOAD_EXAMPLE = {
  device_id: 5,
  GEsaveID: 'GE-TH-001',
  record_time: '2026-05-22T14:30:00',
  // CH1 — before / baseline meter (EM4374, slave_id 1, CT 250A/5A)
  before_L1: 230.1,
  before_L2: 229.8,
  before_L3: 231.0,
  before_current_L1: 68.4,
  before_current_L2: 71.2,
  before_current_L3: 65.9,
  before_kWh: 12345.6,
  before_P: 12.5,
  before_Q: 3.1,
  before_S: 12.9,
  before_PF: 0.968,
  before_THD: 3.2,
  before_F: 50.02,
  // CH2 — metrics / after-install meter (EM4374, slave_id 2, CT 250A/5A)
  metrics_L1: 228.5,
  metrics_L2: 228.2,
  metrics_L3: 229.1,
  metrics_current_L1: 53.7,
  metrics_current_L2: 55.6,
  metrics_current_L3: 51.8,
  metrics_kWh: 12340.1,
  metrics_P: 9.8,
  metrics_Q: 2.3,
  metrics_S: 10.1,
  metrics_PF: 0.971,
  metrics_THD: 1.8,
  metrics_F: 50.01,
} as const;
