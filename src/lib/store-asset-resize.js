function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("ไม่สามารถประมวลผลรูปได้"));
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("สร้างไฟล์ไม่สำเร็จ"))),
      type,
      quality
    );
  });
}

/** Scale image down to fit inside target box — no cropping. */
function drawContain(ctx, img, dx, dy, dw, dh) {
  const scale = Math.min(dw / img.width, dh / img.height, 1);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = dx + (dw - w) / 2;
  const y = dy + (dh - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

/**
 * Resize an image to store asset dimensions without cropping (scale to fit).
 * @returns {{ blob: Blob, url: string, width: number, height: number, fileName: string, mimeType: string }}
 */
export async function resizeImageForStoreAsset(imageUrl, spec, sourceFileName = "asset") {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("เบราว์เซอร์ไม่รองรับการปรับขนาดรูป");

  const useJpeg = spec.kind === "banner";
  const mimeType = useJpeg ? "image/jpeg" : "image/png";

  if (spec.kind === "icon" || spec.kind === "banner") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawContain(ctx, img, 0, 0, spec.width, spec.height);

  const blob = await canvasToBlob(canvas, mimeType, useJpeg ? 0.92 : undefined);
  const ext = useJpeg ? ".jpg" : ".png";
  const stem = String(sourceFileName).replace(/\.[^.]+$/, "") || "asset";
  const fileName = `${spec.id}-${spec.width}x${spec.height}-${stem}${ext}`;

  return {
    blob,
    url: URL.createObjectURL(blob),
    width: spec.width,
    height: spec.height,
    fileName,
    mimeType,
  };
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
