import { NextResponse } from "next/server";
import { getSoftwareProduct } from "@/lib/software-downloads-catalog";
import { buildProductFileResponse, isFreeSoftwareProduct } from "@/lib/software-downloads";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = String(searchParams.get("slug") || "").trim().toLowerCase();

    if (!slug) {
      return NextResponse.json({ error: "ต้องระบุ slug" }, { status: 400 });
    }

    const product = getSoftwareProduct(slug);
    if (!product) {
      return NextResponse.json({ error: "ไม่พบรายการดาวน์โหลด" }, { status: 404 });
    }

    if (!isFreeSoftwareProduct(product)) {
      return NextResponse.json({ error: "รายการนี้ต้องชำระเงินก่อนดาวน์โหลด" }, { status: 403 });
    }

    const result = await buildProductFileResponse(product);
    if (result.response) return result.response;
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "ดาวน์โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
