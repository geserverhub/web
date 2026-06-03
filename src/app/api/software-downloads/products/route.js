import { NextResponse } from "next/server";
import { getActiveSoftwareProducts, productToPublicJson } from "@/lib/software-downloads-catalog";
import { bankToPublicJson } from "@/lib/software-download-bank";
import { publicHubBaseUrl } from "@/lib/data";

export async function GET() {
  const hubUrl = String(process.env.NEXT_PUBLIC_PUBLIC_HUB_URL || publicHubBaseUrl).replace(/\/$/, "");
  const products = getActiveSoftwareProducts().map(productToPublicJson);
  return NextResponse.json({
    products,
    hubUrl,
    bank: bankToPublicJson(),
  });
}
