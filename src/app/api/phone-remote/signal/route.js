import { NextResponse } from "next/server";
import { getRoom, pullSignals, pushSignal, touchRoom } from "@/lib/phone-remote-store";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const since = Number(searchParams.get("since") || 0);
  const role = searchParams.get("role");

  if (!roomId || !role) {
    return NextResponse.json({ error: "roomId and role required" }, { status: 400 });
  }
  if (role !== "host" && role !== "viewer") {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const room = getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  touchRoom(roomId, role);
  const messages = pullSignals(roomId, since, role);
  return NextResponse.json({ messages, serverTime: Date.now() });
}

export async function POST(req) {
  const body = await req.json();
  const { roomId, role, type, payload } = body || {};

  if (!roomId || !role || !type) {
    return NextResponse.json({ error: "roomId, role, type required" }, { status: 400 });
  }
  if (role !== "host" && role !== "viewer") {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  if (!["offer", "answer", "ice", "hangup"].includes(type)) {
    return NextResponse.json({ error: "invalid signal type" }, { status: 400 });
  }

  const room = getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  touchRoom(roomId, role);
  const msg = pushSignal(roomId, role, type, payload ?? null);
  return NextResponse.json({ ok: true, id: msg?.id });
}
