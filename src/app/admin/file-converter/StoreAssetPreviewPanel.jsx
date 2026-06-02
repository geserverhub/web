"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { previewAssetsForPlatform } from "@/lib/mobile-file-converter";

function loadImageMeta(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
    };
    img.src = url;
  });
}

function evaluateAsset(spec, width, height) {
  const messages = [];
  let score = 100;

  if (spec.kind === "icon") {
    const exact = width === spec.width && height === spec.height;
    const square = width === height;
    const bigEnough = width >= spec.width && height >= spec.height;

    if (exact) {
      messages.push({
        level: "ok",
        text: `ขนาดตรง ${spec.width}×${spec.height} px — ตรงตามที่ Store ต้องการ`,
      });
    } else if (square && bigEnough) {
      messages.push({
        level: "warn",
        text: `ขนาด ${width}×${height} px — ใหญ่กว่าที่แนะนำ อัปโหลด ${spec.width}×${spec.height} ตรงๆ จะคมที่สุด`,
      });
      score -= 12;
    } else if (square) {
      messages.push({
        level: "bad",
        text: `ขนาด ${width}×${height} px — เล็กกว่า ${spec.width}×${spec.height} อาจเบลอหลังอัปโหลดจริง`,
      });
      score -= 45;
    } else {
      messages.push({
        level: "bad",
        text: `ไม่เป็นสี่เหลี่ยมจัตุรัส (${width}×${height}) — ไอคอน Store ต้องเป็นสี่เหลี่ยมจัตุรัส`,
      });
      score -= 55;
    }
  } else if (spec.kind === "banner") {
    const exact = width === spec.width && height === spec.height;
    const ratio = width / height;
    const targetRatio = spec.width / spec.height;
    const ratioOk = Math.abs(ratio - targetRatio) < 0.05;

    if (exact) {
      messages.push({ level: "ok", text: `ขนาดตรง ${spec.width}×${spec.height} px` });
    } else if (ratioOk && width >= spec.width && height >= spec.height) {
      messages.push({
        level: "warn",
        text: `สัดส่วนใกล้เคียง 1024:500 แต่ขนาด ${width}×${height} — แนะนำย่อ/ครอปเป็น ${spec.width}×${spec.height}`,
      });
      score -= 18;
    } else {
      messages.push({
        level: "bad",
        text: `สัดส่วน/ขนาดไม่ตรง Feature Graphic (${width}×${height}) — ควรเป็น ${spec.width}×${spec.height}`,
      });
      score -= 40;
    }
  } else {
    const portrait = height >= width;
    const ratio = width / height;
    const targetRatio = spec.width / spec.height;
    const ratioDiff = Math.abs(ratio - targetRatio);
    const minW = spec.minWidth || 320;
    const minH = spec.minHeight || 320;
    const maxW = spec.maxWidth || 99999;
    const maxH = spec.maxHeight || 99999;

    if (!portrait) {
      messages.push({ level: "warn", text: "ภาพเป็นแนวนอน — Store listing มือถือมักใช้แนวตั้ง" });
      score -= 15;
    }
    if (width < minW || height < minH) {
      messages.push({
        level: "bad",
        text: `ขนาดเล็กเกินไป (${width}×${height}) — ควรอย่างน้อย ${minW}×${minH}`,
      });
      score -= 35;
    } else if (width > maxW || height > maxH) {
      messages.push({
        level: "warn",
        text: `ขนาดใหญ่มาก (${width}×${height}) — Store อาจย่อให้ แต่อัปโหลดใกล้ ${spec.width}×${spec.height} จะคมกว่า`,
      });
      score -= 10;
    }
    if (ratioDiff < 0.03 && width >= spec.width * 0.9 && height >= spec.height * 0.9) {
      messages.push({
        level: "ok",
        text: `สัดส่วนและขนาดใกล้เคียง ${spec.width}×${spec.height} — เหมาะกับหน้ารายละเอียดแอป`,
      });
    } else if (ratioDiff < 0.08) {
      messages.push({
        level: "warn",
        text: `สัดส่วนใกล้เคียง แต่ไม่ตรง ${spec.width}×${spec.height} — อาจถูกครอปเล็กน้อยหลังอัปโหลดจริง`,
      });
      score -= 18;
    } else {
      messages.push({
        level: "bad",
        text: `สัดส่วนไม่ตรง (${width}×${height}) — แนะนำ ${spec.width}×${spec.height}`,
      });
      score -= 30;
    }
  }

  const verdict =
    score >= 85 ? "ok" : score >= 60 ? "warn" : "bad";
  const verdictText =
    score >= 85
      ? "สวย โอเค — หลังอัปโหลดจริงน่าจะแสดงผลดี"
      : score >= 60
        ? "ใช้ได้ แต่แนะนำปรับก่อนอัปโหลดจริง"
        : "ยังไม่พร้อม — ควรแก้ขนาด/สัดส่วนก่อนอัปโหลดจริง";

  return { messages, verdict, verdictText, score };
}

function PreviewMock({ spec, previewUrl, platform }) {
  const storeName = platform === "android" ? "Google Play" : "App Store";

  if (spec.kind === "icon") {
    return (
      <div className="fc-preview-mock fc-preview-mock--listing">
        <div className="fc-preview-mock__label">ตัวอย่างบน {storeName}</div>
        <div className="fc-preview-mock__listing-row">
          <div className="fc-preview-mock__listing-icon">
            <img src={previewUrl} alt="" />
          </div>
          <div className="fc-preview-mock__listing-meta">
            <div className="fc-preview-mock__app-name">ชื่อแอปของคุณ</div>
            <div className="fc-preview-mock__app-sub">Developer · ★ 4.8</div>
            <div className="fc-preview-mock__app-cta">ติดตั้ง</div>
          </div>
        </div>
      </div>
    );
  }

  if (spec.kind === "banner") {
    return (
      <div className="fc-preview-mock fc-preview-mock--banner">
        <div className="fc-preview-mock__label">ตัวอย่าง Feature Graphic บน {storeName}</div>
        <div className="fc-preview-mock__banner-frame">
          <img src={previewUrl} alt="" />
        </div>
      </div>
    );
  }

  return (
    <div className="fc-preview-mock fc-preview-mock--phone">
      <div className="fc-preview-mock__label">ตัวอย่างภาพหน้าจอบน {storeName}</div>
      <div className="fc-preview-mock__phone">
        <div className="fc-preview-mock__phone-notch" />
        <div className="fc-preview-mock__phone-screen">
          <img src={previewUrl} alt="" />
        </div>
      </div>
    </div>
  );
}

function AssetPreviewRow({ spec, platform }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setBusy(true);
      setError("");
      try {
        const meta = await loadImageMeta(file);
        const analysis = evaluateAsset(spec, meta.width, meta.height);
        setPreview((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return {
            url: meta.url,
            fileName: file.name,
            width: meta.width,
            height: meta.height,
            size: file.size,
            ...analysis,
          };
        });
      } catch (err) {
        setError(err.message || "อ่านไฟล์ไม่สำเร็จ");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [spec]
  );

  const verdictClass =
    preview?.verdict === "ok"
      ? "success"
      : preview?.verdict === "warn"
        ? "warning"
        : preview
          ? "danger"
          : "";

  return (
    <div className="fc-preview-row border rounded-3 p-3 mb-3 bg-white">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <div className="fw-semibold">{spec.label}</div>
          <div className="small text-muted">{spec.usage}</div>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="d-none"
            accept={spec.accept}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "กำลังเช็ค..." : "อัปโหลดไฟล์เพื่อเช็ค"}
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-danger py-2 small mb-2">{error}</div> : null}

      {preview ? (
        <div className="fc-preview-result">
          <div className={`alert alert-${verdictClass} py-2 mb-3`} role="status">
            <strong>{preview.verdictText}</strong>
            <div className="small mt-1 mb-0">
              หลังอัปโหลดจริงใน {platform === "android" ? "Play Console" : "App Store Connect"} จะแสดงใกล้เคียงตัวอย่างด้านล่าง
              — ถ้าดูสวย/โอเคที่นี่ แปลว่าขึ้น Store แล้วน่าจะใช้ได้
            </div>
          </div>

          <div className="row g-3 align-items-start">
            <div className="col-lg-6">
              <PreviewMock spec={spec} previewUrl={preview.url} platform={platform} />
            </div>
            <div className="col-lg-6">
              <ul className="list-unstyled small mb-2">
                <li>
                  <strong>ไฟล์:</strong> {preview.fileName}
                </li>
                <li>
                  <strong>ขนาดจริง:</strong> {preview.width}×{preview.height} px
                </li>
                <li>
                  <strong>แนะนำ:</strong> {spec.width}×{spec.height} px
                </li>
              </ul>
              <ul className="small mb-0 ps-3">
                {preview.messages.map((msg, i) => (
                  <li
                    key={i}
                    className={
                      msg.level === "ok"
                        ? "text-success"
                        : msg.level === "warn"
                          ? "text-warning-emphasis"
                          : "text-danger"
                    }
                  >
                    {msg.text}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-link btn-sm px-0 mt-2"
                onClick={() => {
                  setPreview((prev) => {
                    if (prev?.url) URL.revokeObjectURL(prev.url);
                    return null;
                  });
                }}
              >
                ล้างตัวอย่าง
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted small mb-0">
          ยังไม่ได้เช็ค — กด 「อัปโหลดไฟล์เพื่อเช็ค」 เพื่อดูความพอดีและความสวยงามก่อนอัปโหลดจริง (ไม่บันทึกลงระบบ)
        </p>
      )}
    </div>
  );
}

export default function StoreAssetPreviewPanel({ platform }) {
  const assets = previewAssetsForPlatform(platform);
  const storeLabel = platform === "android" ? "Google Play" : "App Store";

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <h2 className="h6 mb-1">เช็คไอคอน &amp; ภาพหน้าจอก่อนอัปโหลด {storeLabel}</h2>
        <p className="text-muted small mb-3">
          อัปโหลดไฟล์เพื่อดูตัวอย่างการแสดงผลและตรวจขนาด/สัดส่วน — ไฟล์จะไม่ถูกบันทึก ใช้ทดสอบความพอดีและความสวยงามก่อนอัปโหลดจริงเท่านั้น
        </p>
        {assets.map((spec) => (
          <AssetPreviewRow key={spec.id} spec={spec} platform={platform} />
        ))}
      </div>
    </div>
  );
}
