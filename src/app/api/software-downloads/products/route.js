import { NextResponse } from "next/server";
import { getActiveSoftwareProducts, productToPublicJson } from "@/lib/software-downloads-catalog";
import { publicHubBaseUrl } from "@/lib/data";

export async function GET() {
  const products = getActiveSoftwareProducts().map(productToPublicJson);
  return NextResponse.json({
    products,
    hubUrl: publicHubBaseUrl,
  });
}
