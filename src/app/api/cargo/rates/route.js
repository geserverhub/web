import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const RATES_PATH = join(process.cwd(), "data", "shipping-rates.json");

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(RATES_PATH, "utf8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ air_th_kr: [], air_kr_th: null, sea_kr_th: null });
  }
}
