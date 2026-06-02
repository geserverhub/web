import { NextResponse } from "next/server";
import { createRoom, getRoom } from "@/lib/phone-remote-store";

export async function POST() {
  const { roomId } = createRoom();
  return NextResponse.json({ roomId });
}

export async function GET(req) {
  const roomId = new URL(req.url).searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }
  const room = getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json(room);
}
