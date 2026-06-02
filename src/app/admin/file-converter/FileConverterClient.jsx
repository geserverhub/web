"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("th-TH");
}

function CopyCodeButton({ value, label = "คัดลอก" }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-muted">—</span>;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <code className="small text-break user-select-all">{value}</code>
      <button type="button" className="btn btn-outline-secondary btn-sm py-0 px-2" onClick={copy}>
        {copied ? "✓ คัดลอกแล้ว" : label}
      </button>
    </div>
  );
}

const DEFAULT_STORE_EXTS = {
  android: [
    { ext: ".aab", label: "Android App Bundle", usage: "อัปโหลด Release ใน Google Play Console" },
    { ext: ".png", label: "PNG icon / screenshot", usage: "ไอคอน 512×512 และภาพหน้าจอ" },
  ],
  ios: [
    { ext: ".ipa", label: "iOS App Archive", usage: "อัปโหลดผ่าน Transporter / Xcode" },
    { ext: ".png", label: "PNG icon / screenshot", usage: "ไอคอน 1024×1024 และภาพหน้าจอ" },
  ],
};

function FilesTable({ files, showSigning = true }) {
  if (!files?.length) return <p className="text-muted small mb-0">ไม่มีไฟล์</p>;
  return (
    <div className="table-responsive">
      <table className="table table-sm table-striped align-middle mb-0">
        <thead>
          <tr>
            <th>ไฟล์</th>
            <th>นามสกุล</th>
            <th>SHA-1 (ไฟล์)</th>
            {showSigning ? <th>SHA-1 (Signing)</th> : null}
            <th>ขนาด</th>
            <th>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {files.map((item) => (
            <tr key={item.id || item.fileName}>
              <td>
                <a href={item.filePath} target="_blank" rel="noreferrer">
                  {item.fileName}
                </a>
              </td>
              <td>
                <code>{item.fileExtension}</code>
              </td>
              <td style={{ minWidth: 280 }}>
                <CopyCodeButton value={item.sha1} />
              </td>
              {showSigning ? (
                <td style={{ minWidth: 280 }}>
                  <CopyCodeButton value={item.signingSha1} label="คัดลอก signing" />
                </td>
              ) : null}
              <td>{formatBytes(item.fileSize)}</td>
              <td className="small text-muted">{item.usageNote || item.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FileConverterClient() {
  const [platform, setPlatform] = useState("android");
  const [file, setFile] = useState(null);
  const [bundleFile, setBundleFile] = useState(null);
  const [storeRules, setStoreRules] = useState(DEFAULT_STORE_EXTS);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/file-converter/history?limit=30");
      const data = await res.json();
      if (res.ok) setHistory(data.jobs || []);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/file-converter")
      .then((r) => r.json())
      .then((data) => {
        if (data.platforms) {
          setStoreRules({
            android: data.platforms.android.storeUploadExtensions,
            ios: data.platforms.ios.storeUploadExtensions,
          });
        }
      })
      .catch(() => {});
    loadHistory();
  }, [loadHistory]);

  const sizes = useMemo(
    () => (platform === "android" ? [48, 72, 96, 144, 192, 512] : [60, 76, 120, 152, 167, 180, 1024]),
    [platform]
  );

  const bundleAccept = platform === "android" ? ".aab" : ".ipa";
  const bundleLabel = platform === "android" ? "Android App Bundle (.aab)" : "iOS App Archive (.ipa)";
  const storeExts = storeRules[platform] || [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("กรุณาเลือกไฟล์รูปก่อน");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("platform", platform);
      formData.append("file", file);
      if (bundleFile) formData.append("bundle", bundleFile);
      const res = await fetch("/api/admin/file-converter", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถแปลงไฟล์ได้");
      setResult(data);
      loadHistory();
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
        อัปโหลดโลโก้/ไอคอนต้นฉบับ ระบบจะสร้างไฟล์หลังแปลง (.png) แนบ .aab/.ipa บันทึก SHA-1 และแสดงประวัติ
      </p>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h2 className="h6 mb-2">นามสกุลที่อัปโหลด {platform === "android" ? "Play Store" : "App Store"} ได้</h2>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>นามสกุล</th>
                  <th>ประเภท</th>
                  <th>การใช้งาน</th>
                </tr>
              </thead>
              <tbody>
                {storeExts.map((row) => (
                  <tr key={row.ext}>
                    <td>
                      <code>{row.ext}</code>
                    </td>
                    <td>{row.label}</td>
                    <td className="text-muted small">{row.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">แพลตฟอร์ม</label>
              <select
                className="form-select"
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setBundleFile(null);
                }}
                disabled={busy}
              >
                <option value="android">Android (Play Store)</option>
                <option value="ios">iOS (App Store)</option>
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">ไฟล์รูปต้นฉบับ (PNG/JPG/WEBP, สูงสุด 10MB)</label>
              <input
                type="file"
                className="form-control"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={busy}
              />
            </div>
            <div className="col-12">
              <label className="form-label">แนบไฟล์แอป ({bundleLabel}) — ไม่บังคับ</label>
              <input
                type="file"
                className="form-control"
                accept={bundleAccept}
                onChange={(e) => setBundleFile(e.target.files?.[0] || null)}
                disabled={busy}
              />
              <div className="form-text">
                แนบ {bundleAccept} — ระบบจะดึง SHA-1 signing certificate จาก .aab อัตโนมัติ
              </div>
            </div>
            <div className="col-12">
              <div className="small text-muted mb-2">ขนาดไอคอนที่จะสร้าง: {sizes.join(", ")} px (.png)</div>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "กำลังแปลงไฟล์..." : "แปลงไฟล์และบันทึกฐานข้อมูล"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h2 className="h5 mb-3">ผลการแปลงล่าสุด</h2>
            <p className="mb-2">
              <strong>Job ID:</strong> <CopyCodeButton value={result.jobId} />
            </p>
            <p className="mb-2">
              <strong>SHA-1 ต้นฉบับ:</strong> <CopyCodeButton value={result.sourceSha1} />
            </p>
            {result.bundle?.signingSha1 ? (
              <p className="mb-2">
                <strong>SHA-1 Signing (.aab):</strong>{" "}
                <CopyCodeButton value={result.bundle.signingSha1} label="คัดลอก signing" />
              </p>
            ) : null}
            <FilesTable files={result.files} />
          </div>
        </div>
      ) : null}

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">ประวัติการแปลงไฟล์</h2>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadHistory} disabled={historyLoading}>
              {historyLoading ? "กำลังโหลด..." : "รีเฟรช"}
            </button>
          </div>

          {historyLoading && !history.length ? (
            <p className="text-muted mb-0">กำลังโหลดประวัติ...</p>
          ) : !history.length ? (
            <p className="text-muted mb-0">ยังไม่มีประวัติการแปลง</p>
          ) : (
            <div className="accordion" id="conversionHistory">
              {history.map((job, idx) => (
                <div className="accordion-item" key={job.id}>
                  <h3 className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#job-${job.id}`}
                    >
                      <span className="me-2 badge text-bg-secondary">{job.platform}</span>
                      {job.sourceName}
                      <span className="ms-2 small text-muted">{formatDate(job.createdAt)}</span>
                    </button>
                  </h3>
                  <div id={`job-${job.id}`} className="accordion-collapse collapse" data-bs-parent="#conversionHistory">
                    <div className="accordion-body">
                      <div className="mb-2 small">
                        <strong>Job ID:</strong> <CopyCodeButton value={job.id} />
                      </div>
                      <div className="mb-2 small">
                        <strong>SHA-1 ต้นฉบับ:</strong> <CopyCodeButton value={job.sourceSha1} />
                      </div>
                      {job.bundleSigningSha1 ? (
                        <div className="mb-2 small">
                          <strong>SHA-1 Signing แอป:</strong>{" "}
                          <CopyCodeButton value={job.bundleSigningSha1} label="คัดลอก signing" />
                        </div>
                      ) : null}
                      {job.bundleName ? (
                        <div className="mb-3 small">
                          <strong>แอปที่แนบ:</strong>{" "}
                          <a href={job.bundlePath} target="_blank" rel="noreferrer">
                            {job.bundleName}
                          </a>{" "}
                          {job.bundleSha1 ? (
                            <>
                              — SHA-1: <CopyCodeButton value={job.bundleSha1} />
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      <FilesTable files={job.files} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
