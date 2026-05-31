'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { erpApiHeaders } from '@/lib/erp-api-auth';

const MODEL_URL = '/face-api-models';

const COPY = {
  th: {
    scanTab: 'สแกนเข้า-ออกงาน',
    enrollTab: 'ลงทะเบียนใบหน้า',
    checkIn: 'เข้างาน',
    checkOut: 'ออกงาน',
    startCamera: 'เปิดกล้อง',
    stopCamera: 'ปิดกล้อง',
    selectEmployee: 'เลือกพนักงาน',
    enrollFace: 'บันทึกใบหน้า',
    loadingModels: 'กำลังโหลดระบบจดจำใบหน้า…',
    cameraHint: 'จัดใบหน้าให้อยู่กลางกรอบ แล้วกดปุ่มเข้างาน/ออกงาน',
    enrollHint: 'เลือกพนักงาน แล้วสแกนใบหน้าเพื่อลงทะเบียน (ครั้งแรกเท่านั้น)',
    recentTitle: 'บันทึกล่าสุด (สแกนใบหน้า)',
    refresh: 'รีเฟรช',
    noRecords: 'ยังไม่มีบันทึก',
    enrolled: 'ลงทะเบียนแล้ว',
    notEnrolled: 'ยังไม่ลงทะเบียน',
    successIn: 'บันทึกเข้างานสำเร็จ',
    successOut: 'บันทึกออกงานสำเร็จ',
    enrollOk: 'ลงทะเบียนใบหน้าสำเร็จ',
    faceNotFound: 'ไม่พบใบหน้าในกล้อง — ลองขยับใกล้/แสงสว่างขึ้น',
    notRecognized: 'ไม่ตรงกับพนักงานในระบบ — ลงทะเบียนใบหน้าก่อน',
    ambiguous: 'ใบหน้าใกล้เคียงหลายคน — ลองใหม่',
    alreadyIn: 'วันนี้บันทึกเข้างานแล้ว',
    alreadyOut: 'วันนี้บันทึกออกงานแล้ว',
    needInFirst: 'ต้องบันทึกเข้างานก่อน',
    noEnrolled: 'ยังไม่มีพนักงานที่ลงทะเบียนใบหน้า',
    modelsError: 'โหลดระบบ AI ไม่สำเร็จ — ตรวจสอบอินเทอร์เน็ต',
    cameraError: 'เปิดกล้องไม่ได้ — อนุญาต camera ในเบราว์เซอร์',
  },
  en: {
    scanTab: 'Face clock in/out',
    enrollTab: 'Enroll face',
    checkIn: 'Check in',
    checkOut: 'Check out',
    startCamera: 'Start camera',
    stopCamera: 'Stop camera',
    selectEmployee: 'Select employee',
    enrollFace: 'Save face',
    loadingModels: 'Loading face recognition models…',
    cameraHint: 'Center your face in the frame, then tap check in/out.',
    enrollHint: 'Select an employee and scan once to register their face.',
    recentTitle: 'Recent face attendance',
    refresh: 'Refresh',
    noRecords: 'No records yet',
    enrolled: 'Enrolled',
    notEnrolled: 'Not enrolled',
    successIn: 'Check-in recorded',
    successOut: 'Check-out recorded',
    enrollOk: 'Face enrolled successfully',
    faceNotFound: 'No face detected — adjust lighting or move closer',
    notRecognized: 'Face not matched — enroll first',
    ambiguous: 'Ambiguous match — try again',
    alreadyIn: 'Already checked in today',
    alreadyOut: 'Already checked out today',
    needInFirst: 'Check in required first',
    noEnrolled: 'No enrolled employees yet',
    modelsError: 'Failed to load AI models — check internet',
    cameraError: 'Camera unavailable — allow camera permission',
  },
};

function pickCopy(lang) {
  return COPY[lang] || COPY.en;
}

function mapApiError(code, t) {
  if (code === 'face_not_recognized') return t.notRecognized;
  if (code === 'ambiguous_match') return t.ambiguous;
  if (code === 'already_checked_in') return t.alreadyIn;
  if (code === 'already_checked_out') return t.alreadyOut;
  if (code === 'check_in_required_first') return t.needInFirst;
  if (code === 'no_enrolled_faces') return t.noEnrolled;
  return code || 'Error';
}

async function loadFaceApi() {
  const faceapi = await import('@vladmandic/face-api');
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  return faceapi;
}

export default function ErpFaceAttendancePanel({ lang }) {
  const t = useMemo(() => pickCopy(lang), [lang]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceapiRef = useRef(null);

  const [mode, setMode] = useState('scan');
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageOk, setMessageOk] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [rows, setRows] = useState([]);

  const loadEmployees = useCallback(async () => {
    const res = await fetch('/api/ge-energy-erp/face-enrollment', {
      headers: erpApiHeaders(),
    });
    const data = await res.json();
    if (res.ok) setEmployees(data.employees || []);
  }, []);

  const loadRecords = useCallback(async () => {
    const res = await fetch('/api/ge-energy-erp/face-attendance?limit=30', {
      headers: erpApiHeaders(),
    });
    const data = await res.json();
    if (res.ok) setRows(data.rows || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const faceapi = await loadFaceApi();
        if (cancelled) return;
        faceapiRef.current = faceapi;
        setModelsReady(true);
      } catch {
        if (!cancelled) setModelsError(t.modelsError);
      }
    })();
    loadEmployees();
    loadRecords();
    return () => {
      cancelled = true;
    };
  }, [loadEmployees, loadRecords, t.modelsError]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setMessage(t.cameraError);
      setMessageOk(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const captureDescriptorAndPhoto = async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video) throw new Error('not_ready');

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('no_face');
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const photoData = canvas.toDataURL('image/jpeg', 0.88);
    const descriptor = Array.from(detection.descriptor);

    return { descriptor, photoData };
  };

  const handleClock = async (eventType) => {
    if (!modelsReady || !cameraOn || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { descriptor, photoData } = await captureDescriptorAndPhoto();
      const res = await fetch('/api/ge-energy-erp/face-attendance', {
        method: 'POST',
        headers: { ...erpApiHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, descriptor, photoData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageOk(false);
        setMessage(mapApiError(data.error, t));
        return;
      }
      setMessageOk(true);
      setMessage(
        `${eventType === 'check_in' ? t.successIn : t.successOut}: ${data.employee?.name || ''} (${data.employee?.code || ''})`
      );
      loadRecords();
    } catch (err) {
      setMessageOk(false);
      setMessage(err?.message === 'no_face' ? t.faceNotFound : t.modelsError);
    } finally {
      setBusy(false);
    }
  };

  const handleEnroll = async () => {
    if (!modelsReady || !cameraOn || busy || !employeeId) return;
    setBusy(true);
    setMessage('');
    try {
      const { descriptor, photoData } = await captureDescriptorAndPhoto();
      const res = await fetch('/api/ge-energy-erp/face-enrollment', {
        method: 'POST',
        headers: { ...erpApiHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: Number(employeeId),
          descriptor,
          photoData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageOk(false);
        setMessage(data.error || t.modelsError);
        return;
      }
      setMessageOk(true);
      setMessage(t.enrollOk);
      loadEmployees();
    } catch (err) {
      setMessageOk(false);
      setMessage(err?.message === 'no_face' ? t.faceNotFound : t.modelsError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="geerp-face-panel">
      <div className="geerp-face-tabs">
        <button
          type="button"
          className={mode === 'scan' ? 'active' : ''}
          onClick={() => setMode('scan')}
        >
          {t.scanTab}
        </button>
        <button
          type="button"
          className={mode === 'enroll' ? 'active' : ''}
          onClick={() => setMode('enroll')}
        >
          {t.enrollTab}
        </button>
      </div>

      {!modelsReady && !modelsError ? (
        <p className="geerp-page-loading">{t.loadingModels}</p>
      ) : null}
      {modelsError ? <div className="geerp-dev-alert geerp-dev-alert--error">{modelsError}</div> : null}

      <p className="geerp-content-hint">{mode === 'scan' ? t.cameraHint : t.enrollHint}</p>

      <div className="geerp-face-layout">
        <div className="geerp-face-camera-wrap">
          <video ref={videoRef} className="geerp-face-video" playsInline muted />
          {!cameraOn ? <div className="geerp-face-camera-placeholder">📷</div> : null}
        </div>

        <div className="geerp-face-actions">
          {!cameraOn ? (
            <button type="button" className="geerp-tool-btn" onClick={startCamera} disabled={!modelsReady}>
              {t.startCamera}
            </button>
          ) : (
            <button type="button" className="geerp-tool-btn geerp-tool-btn--muted" onClick={stopCamera}>
              {t.stopCamera}
            </button>
          )}

          {mode === 'scan' ? (
            <>
              <button
                type="button"
                className="geerp-face-btn geerp-face-btn--in"
                disabled={!cameraOn || busy}
                onClick={() => handleClock('check_in')}
              >
                {t.checkIn}
              </button>
              <button
                type="button"
                className="geerp-face-btn geerp-face-btn--out"
                disabled={!cameraOn || busy}
                onClick={() => handleClock('check_out')}
              >
                {t.checkOut}
              </button>
            </>
          ) : (
            <>
              <label className="geerp-label" htmlFor="geerp-face-employee">
                {t.selectEmployee}
              </label>
              <select
                id="geerp-face-employee"
                className="geerp-input"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">—</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code})
                    {emp.face_id ? ` · ${t.enrolled}` : ` · ${t.notEnrolled}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="geerp-tool-btn"
                disabled={!cameraOn || busy || !employeeId}
                onClick={handleEnroll}
              >
                {t.enrollFace}
              </button>
            </>
          )}
        </div>
      </div>

      {message ? (
        <div className={`geerp-dev-alert ${messageOk ? 'geerp-dev-alert--ok' : 'geerp-dev-alert--error'}`}>
          {message}
        </div>
      ) : null}

      <div className="geerp-face-recent">
        <div className="geerp-toolbar">
          <h3>{t.recentTitle}</h3>
          <button type="button" className="geerp-tool-btn" onClick={loadRecords}>
            {t.refresh}
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="geerp-content-hint">{t.noRecords}</p>
        ) : (
          <div className="geerp-table-wrap">
            <table className="geerp-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Employee</th>
                  <th>Event</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{String(row.capturedAt || '').replace('T', ' ').slice(0, 19)}</td>
                    <td>
                      {row.employeeName}
                      <br />
                      <small>{row.employeeCode}</small>
                    </td>
                    <td>
                      <span className={`geerp-badge ${row.eventType === 'check_in' ? 'geerp-badge--ok' : 'geerp-badge--pending'}`}>
                        {row.eventType}
                      </span>
                    </td>
                    <td>
                      {row.photoPath ? (
                        <a href={row.photoPath} target="_blank" rel="noreferrer">
                          <img src={row.photoPath} alt="" className="geerp-face-thumb" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
