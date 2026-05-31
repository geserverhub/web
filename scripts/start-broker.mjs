/**
 * Local MQTT broker (aedes v1.x) — ใช้แทน Mosquitto เมื่อไม่ได้ติดตั้ง
 * Usage: node scripts/start-broker.mjs
 * Port: 1883 (standard MQTT)
 */
import { createServer } from 'net';
import { Aedes } from 'aedes';

const PORT = Number(process.env.MQTT_BROKER_PORT || 1883);

const broker = await Aedes.createBroker();
const server = createServer(broker.handle);

broker.on('client', (client) => {
  console.log(`[broker] connected  clientId=${client.id}`);
});

broker.on('clientDisconnect', (client) => {
  console.log(`[broker] disconnected clientId=${client.id}`);
});

broker.on('clientError', (client, err) => {
  console.error(`[broker] clientError clientId=${client?.id} err=${err.message}`);
});

broker.on('connectionError', (client, err) => {
  console.error(`[broker] connectionError err=${err.message}`);
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
  console.log(`[broker] Publish test: node scripts/test-publish.mjs`);
});

server.on('error', (err) => {
  console.error('[broker] Error:', err.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n[broker] Shutting down...');
  broker.close(() => { server.close(() => process.exit(0)); });
});
