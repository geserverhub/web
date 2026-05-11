import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const RATES_PATH = join(process.cwd(), "data", "shipping-rates.json");

function isAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const data = JSON.parse(readFileSync(RATES_PATH, "utf8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ air_th_kr: [], air_kr_th: null, sea_kr_th: null });
  }
}

export async function PUT(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    writeFileSync(RATES_PATH, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
