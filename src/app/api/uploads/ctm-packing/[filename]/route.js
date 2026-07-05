import { readFile } from "fs/promises";
import path from "path";

export async function GET(req, { params }) {
  try {
    const { filename } = await params;
    if (!filename || /[\/\\]/.test(filename)) {
      return new Response("Not found", { status: 404 });
    }
    const ext = path.extname(filename).toLowerCase();
    const mimeMap = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
    const mime = mimeMap[ext];
    if (!mime) return new Response("Not found", { status: 404 });

    const filePath = path.join(process.cwd(), "public", "uploads", "ctm-packing", filename);
    const buf = await readFile(filePath);
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
