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

/** Center-crop source rect to target aspect, then draw into destination. */
function drawCover(ctx, img, dx, dy, dw, dh) {
  const targetRatio = dw / dh;
  const sourceRatio = img.width / img.height;
  let sx;
  let sy;
  let sw;
  let sh;

  if (sourceRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Resize/crop an image to store asset dimensions (client-side canvas).
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

  if (spec.kind === "icon") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawCover(ctx, img, 0, 0, spec.width, spec.height);

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
