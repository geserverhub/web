"use client";

import { useMemo, useState } from "react";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileConverterClient() {
  const [platform, setPlatform] = useState("android");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const sizes = useMemo(
    () => (platform === "android" ? [48, 72, 96, 144, 192, 512] : [60, 76, 120, 152, 167, 180, 1024]),
    [platform]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("platform", platform);
      formData.append("file", file);
      const res = await fetch("/api/admin/file-converter", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถแปลงไฟล์ได้");
      setResult(data);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container py-4">
      <h1 className="mb-3">ระบบแปลงไฟล์สำหรับ Android / iOS</h1>
      <p className="text-muted mb-4">
        อัปโหลดไฟล์ภาพ 1 ไฟล์ ระบบจะเก็บไฟล์ต้นฉบับและสร้างไฟล์หลังแปลงตามขนาดที่เหมาะกับแต่ละแพลตฟอร์ม
      </p>

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">แพลตฟอร์ม</label>
              <select
                className="form-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={busy}
              >
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">ไฟล์รูปภาพ (PNG/JPG/WEBP, สูงสุด 10MB)</label>
              <input
                type="file"
                className="form-control"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={busy}
              />
            </div>
            <div className="col-12">
              <div className="small text-muted mb-2">ขนาดที่จะสร้าง: {sizes.join(", ")} px</div>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "กำลังแปลงไฟล์..." : "แปลงไฟล์และบันทึกฐานข้อมูล"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="card shadow-sm mt-3">
          <div className="card-body">
            <h2 className="h5 mb-3">ผลการแปลงไฟล์</h2>
            <p className="mb-2">
              <strong>Job ID:</strong> {result.jobId}
            </p>
            <p>
              <strong>ไฟล์ก่อนแปลง:</strong>{" "}
              <a href={result.source} target="_blank" rel="noreferrer">
                {result.source}
              </a>
            </p>
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>ไฟล์</th>
                    <th>ขนาด</th>
                    <th>ไซซ์</th>
                  </tr>
                </thead>
                <tbody>
                  {result.files.map((item) => (
                    <tr key={item.fileName}>
                      <td>
                        <a href={item.filePath} target="_blank" rel="noreferrer">
                          {item.fileName}
                        </a>
                      </td>
                      <td>{formatBytes(item.fileSize)}</td>
                      <td>
                        {item.width}x{item.height}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
