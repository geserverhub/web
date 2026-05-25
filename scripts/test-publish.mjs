/**
 * Test MQTT publish → power_records pipeline
 * Usage: node scripts/test-publish.mjs
 */
import mqtt from 'mqtt';

const BROKER = 'mqtt://127.0.0.1:1883';
const TOPIC  = 'ge/GE-TH-001';

const payload = JSON.stringify({
  geID:         'GE-TH-001',
  before_P:     12500,
  metrics_P:    9800,
  before_kWh:   12345.6,
  metrics_kWh:  12340.1,
  before_PF:    0.948,
  metrics_PF:   0.954,
  before_THD:   3.2,
  metrics_THD:  1.8,
  before_F:     50,
  metrics_F:    50,
});

console.log('[test] Connecting to', BROKER);
console.log('[test] Topic:', TOPIC);
console.log('[test] Payload:', payload);

const client = mqtt.connect(BROKER, {
  protocolVersion: 4,   // MQTT 3.1.1 — compatible with aedes v1
  clientId: 'ge-test-pub-' + Date.now(),
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 0,   // no auto-reconnect
});

let done = false;

client.on('connect', () => {
  console.log('[test] Connected! Publishing...');
  client.publish(TOPIC, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('[test] Publish error:', err.message);
      done = true;
      client.end(false, () => process.exit(1));
    } else {
      console.log('[test] Published successfully (PUBACK received)!');
      console.log('[test] Check power_records table for new row with device_id=4');
      done = true;
      // Give broker a moment to route to subscribers before disconnecting
      setTimeout(() => client.end(false, () => process.exit(0)), 500);
    }
  });
});

client.on('error', (err) => {
  console.error('[test] Connection error:', err.message);
  process.exit(1);
});

client.on('close', () => {
  if (!done) {
    console.error('[test] Connection closed before publish completed');
    process.exit(1);
  }
});

// Timeout guard
setTimeout(() => {
  if (!done) {
    console.error('[test] Timed out waiting for CONNACK after 12s');
    process.exit(1);
  }
}, 12000);
