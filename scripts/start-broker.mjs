/**
 * Local MQTT broker (aedes) — ใช้แทน Mosquitto เมื่อไม่ได้ติดตั้ง
 * Usage: node scripts/start-broker.mjs
 * Port: 1883 (standard MQTT)
 */
import { createServer } from 'net';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const aedesModule = require('aedes');
const Aedes = aedesModule.Aedes || aedesModule.default?.Aedes || aedesModule.default || aedesModule;

const PORT = Number(process.env.MQTT_BROKER_PORT || 1883);

const broker = new Aedes();
const server = createServer(broker.handle);

broker.on('client', (client) => {
  console.log(`[broker] connected  clientId=${client.id}`);
});

broker.on('clientDisconnect', (client) => {
  console.log(`[broker] disconnected clientId=${client.id}`);
});

broker.on('publish', (packet, client) => {
  if (client && packet.topic && !packet.topic.startsWith('$')) {
    console.log(`[broker] publish  topic=${packet.topic}  from=${client.id}  size=${packet.payload.length}B`);
  }
});

broker.on('subscribe', (subscriptions, client) => {
  const topics = subscriptions.map((s) => s.topic).join(', ');
  console.log(`[broker] subscribe clientId=${client.id}  topics=${topics}`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[broker] MQTT broker running on port ${PORT}`);
  console.log(`[broker] Publish test: npx mqtt pub -h 127.0.0.1 -t "ge/GE-TH-001" -m '{"geID":"GE-TH-001","before_P":12.5,"metrics_P":9.8}'`);
});

server.on('error', (err) => {
  console.error('[broker] Error:', err.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n[broker] Shutting down...');
  broker.close(() => { server.close(() => process.exit(0)); });
});
