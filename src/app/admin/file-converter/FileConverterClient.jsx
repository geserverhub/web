"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { androidAppArchiveLabel } from "@/lib/mobile-file-converter";
import StoreAssetPreviewPanel from "./StoreAssetPreviewPanel";

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
    { ext: ".apk", label: "Android APK", usage: "ทดสอบติดตั้ง / ตรวจ SHA-1 signing certificate" },
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

function AppArchivesTable({ records }) {
  if (!records?.length) {
    return <p className="text-muted small mb-0">ยังไม่มีข้อมูล SHA-1 จากไฟล์แอปที่บันทึกแยก</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-sm table-striped align-middle mb-0">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>แพลตฟอร์ม</th>
            <th>ประเภท</th>
            <th>Package name</th>
            <th>ไฟล์</th>
            <th>ดาวน์โหลด</th>
            <th>ขนาด</th>
            <th>SHA-1 (ไฟล์)</th>
            <th>SHA-1 (Signing)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td className="small text-nowrap">{formatDate(row.createdAt)}</td>
              <td>
                <span className="badge text-bg-secondary">{row.platform}</span>
              </td>
              <td>
                <span className="badge text-bg-info">{androidAppArchiveLabel(row.fileExtension)}</span>
              </td>
              <td className="small">
                {row.packageName ? <code>{row.packageName}</code> : <span className="text-muted">—</span>}
              </td>
              <td className="small text-break">{row.fileName}</td>
              <td className="text-nowrap">
                <a
                  href={`/api/admin/file-converter/app-archives/${row.id}/download`}
                  className="btn btn-outline-primary btn-sm py-0 px-2"
                  download={row.fileName}
                >
                  ดาวน์โหลด
                </a>
              </td>
              <td className="small">{formatBytes(row.fileSize)}</td>
              <td style={{ minWidth: 280 }}>
                <CopyCodeButton value={row.fileSha1} />
              </td>
              <td style={{ minWidth: 280 }}>
                <CopyCodeButton value={row.signingSha1} label="คัดลอก signing" />
              </td>
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
  const [appArchives, setAppArchives] = useState([]);
  const [appArchivesLoading, setAppArchivesLoading] = useState(true);
  const [bundleSaving, setBundleSaving] = useState(false);
  const [bundleSaveOk, setBundleSaveOk] = useState("");
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

  const loadAppArchives = useCallback(async () => {
    setAppArchivesLoading(true);
    try {
      const res = await fetch("/api/admin/file-converter/app-archives?limit=50");
      const data = await res.json();
      if (res.ok) setAppArchives(data.records || []);
    } catch {
      /* ignore */
    } finally {
      setAppArchivesLoading(false);
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
    loadAppArchives();
  }, [loadHistory, loadAppArchives]);

  const sizes = useMemo(
    () => (platform === "android" ? [48, 72, 96, 144, 192, 512] : [60, 76, 120, 152, 167, 180, 1024]),
    [platform]
  );

  const bundleAccept = platform === "android" ? ".aab,.apk" : ".ipa";
  const bundleLabel =
    platform === "android" ? "Android App Bundle / APK (.aab, .apk)" : "iOS App Archive (.ipa)";
  const storeExts = storeRules[platform] || [];

  async function handleSaveAppArchive() {
    if (!bundleFile) {
      setError("กรุณาเลือกไฟล์แอป (.aab / .apk / .ipa) ก่อน");
      return;
    }
    setBundleSaving(true);
    setError("");
    setBundleSaveOk("");
    try {
      const formData = new FormData();
      formData.append("platform", platform);
      formData.append("bundle", bundleFile);
      const res = await fetch("/api/admin/file-converter/app-archives", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      const pkg = data.record?.packageName ? ` — Package: ${data.record.packageName}` : "";
      setBundleSaveOk(`บันทึก SHA-1 จาก ${bundleFile.name} แล้ว${pkg}`);
      loadAppArchives();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setBundleSaving(false);
    }
  }

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
        อัปโหลดโลโก้/ไอคอนต้นฉบับ ระบบจะสร้างไฟล์หลังแปลง (.png) แนบ .aab/.apk/.ipa บันทึก SHA-1 และแสดงประวัติ
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

      <StoreAssetPreviewPanel platform={platform} />

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
              <div className="form-text mb-2">
                แนบ {bundleAccept} — ระบบจะดึง SHA-1 signing certificate จาก .aab / .apk อัตโนมัติ
              </div>
              {bundleFile ? (
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="small text-muted">เลือกแล้ว: {bundleFile.name}</span>
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    disabled={busy || bundleSaving}
                    onClick={handleSaveAppArchive}
                  >
                    {bundleSaving ? "กำลังบันทึก..." : "บันทึก SHA-1 จากไฟล์แอปลงฐานข้อมูล"}
                  </button>
                </div>
              ) : null}
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

      {bundleSaveOk ? (
        <div className="alert alert-success mb-3" role="status">
          {bundleSaveOk}
        </div>
      ) : null}

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
                <strong>
                  SHA-1 Signing ({androidAppArchiveLabel(result.bundle.extension || ".aab")}):
                </strong>{" "}
                <CopyCodeButton value={result.bundle.signingSha1} label="คัดลอก signing" />
              </p>
            ) : null}
            {result.bundle ? (
              <p className="mb-2 small">
                <strong>ไฟล์แอปที่แนบ:</strong>{" "}
                <a href={result.bundle.path} target="_blank" rel="noreferrer">
                  {result.bundle.name}
                </a>{" "}
                ({androidAppArchiveLabel(result.bundle.extension || "")})
                {result.bundle.sha1 ? (
                  <>
                    {" "}
                    — SHA-1: <CopyCodeButton value={result.bundle.sha1} />
                  </>
                ) : null}
              </p>
            ) : null}
            <FilesTable files={result.files} />
          </div>
        </div>
      ) : null}

      <div className="card shadow-sm mb-3">
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
                      {job.bundleExtension ? (
                        <span className="me-2 badge text-bg-info">
                          {androidAppArchiveLabel(job.bundleExtension)}
                        </span>
                      ) : null}
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
                          <strong>
                            SHA-1 Signing ({androidAppArchiveLabel(job.bundleExtension || ".aab")}):
                          </strong>{" "}
                          <CopyCodeButton value={job.bundleSigningSha1} label="คัดลอก signing" />
                        </div>
                      ) : null}
                      {job.bundleName ? (
                        <div className="mb-3 small">
                          <strong>แอปที่แนบ ({androidAppArchiveLabel(job.bundleExtension || "")}):</strong>{" "}
                          <a href={job.bundlePath} target="_blank" rel="noreferrer">
                            {job.bundleName}
                          </a>{" "}
                          {job.bundleSize ? (
                            <span className="text-muted">({formatBytes(job.bundleSize)})</span>
                          ) : null}
                          {job.bundleSha1 ? (
                            <>
                              <div className="mt-1">
                                SHA-1 ไฟล์: <CopyCodeButton value={job.bundleSha1} />
                              </div>
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

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">ตาราง SHA-1 จากไฟล์แอป (APK / AAB / IPA)</h2>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={loadAppArchives}
              disabled={appArchivesLoading}
            >
              {appArchivesLoading ? "กำลังโหลด..." : "รีเฟรช"}
            </button>
          </div>
          <p className="text-muted small mb-3">
            บันทึกจากปุ่ม 「บันทึก SHA-1 จากไฟล์แอปลงฐานข้อมูล」 — ดึง SHA-1 และ Package name (เช่น momogespace.myapp) จาก .aab / .apk
            และเก็บไฟล์ต้นฉบับไว้ดาวน์โหลดภายหลังได้จากคอลัมน์ 「ดาวน์โหลด」
          </p>
          {appArchivesLoading && !appArchives.length ? (
            <p className="text-muted mb-0">กำลังโหลด...</p>
          ) : (
            <AppArchivesTable records={appArchives} />
          )}
        </div>
      </div>
    </main>
  );
}
