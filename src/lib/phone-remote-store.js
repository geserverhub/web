/**
 * In-memory signaling store for phone screen remote (WebRTC).
 * For multi-instance production, replace with Redis.
 */

const ROOM_TTL_MS = 60 * 60 * 1000;
const rooms = new Map();

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function prune() {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) rooms.delete(id);
  }
}

export function createRoom() {
  prune();
  let id = randomCode();
  while (rooms.has(id)) id = randomCode();
  const room = {
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hostOnline: false,
    viewerOnline: false,
    signals: [],
  };
  rooms.set(id, room);
  return { roomId: id };
}

export function getRoom(roomId) {
  prune();
  const room = rooms.get(String(roomId || "").toUpperCase());
  if (!room) return null;
  return {
    id: room.id,
    hostOnline: room.hostOnline,
    viewerOnline: room.viewerOnline,
    createdAt: room.createdAt,
    signalCount: room.signals.length,
  };
}

export function touchRoom(roomId, role) {
  const room = rooms.get(String(roomId || "").toUpperCase());
  if (!room) return false;
  room.updatedAt = Date.now();
  if (role === "host") room.hostOnline = true;
  if (role === "viewer") room.viewerOnline = true;
  return true;
}

export function pushSignal(roomId, from, type, payload) {
  const room = rooms.get(String(roomId || "").toUpperCase());
  if (!room) return null;
  const msg = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from,
    type,
    payload,
    at: Date.now(),
  };
  room.signals.push(msg);
  room.updatedAt = Date.now();
  if (room.signals.length > 200) room.signals.splice(0, room.signals.length - 200);
  return msg;
}

export function pullSignals(roomId, since = 0, forRole) {
  const room = rooms.get(String(roomId || "").toUpperCase());
  if (!room) return [];
  return room.signals.filter(
    (m) => m.at > since && m.from !== forRole
  );
}
