"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  bindRemoteVideoToPeerConnection,
  createIceQueue,
  createPeerConnection,
  fetchRoom,
  sendSignal,
  setupControlChannel,
  startSignalPoll,
  toSessionDescription,
} from "@/lib/phone-remote-webrtc";
import { bindViewerControlOverlay } from "@/lib/phone-remote-control";

export default function PhoneRemoteViewClient() {
  const searchParams = useSearchParams();
  const initialRoom = (searchParams.get("room") || "").toUpperCase();

  const remoteVideoRef = useRef(null);
  const controlOverlayRef = useRef(null);
  const pcRef = useRef(null);
  const stopPollRef = useRef(null);
  const unbindVideoRef = useRef(null);
  const waitTimerRef = useRef(null);
  const controlRef = useRef(null);
  const unbindControlRef = useRef(null);

  const [roomInput, setRoomInput] = useState(initialRoom);
  const [activeRoom, setActiveRoom] = useState("");
  const [status, setStatus] = useState("idle");
  const [hasVideo, setHasVideo] = useState(false);
  const [needsPlayTap, setNeedsPlayTap] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [controlEnabled, setControlEnabled] = useState(true);
  const [controlReady, setControlReady] = useState(false);

  const cleanup = useCallback(() => {
    unbindControlRef.current?.();
    unbindControlRef.current = null;
    unbindVideoRef.current?.();
    unbindVideoRef.current = null;
    stopPollRef.current?.();
    stopPollRef.current = null;
    if (waitTimerRef.current) {
      clearInterval(waitTimerRef.current);
      waitTimerRef.current = null;
    }
    controlRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setControlReady(false);
    setHasVideo(false);
    setNeedsPlayTap(false);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  useEffect(() => {
    if (!initialRoom) return;
    let cancelled = false;
    void connectViewer(initialRoom).then(() => {
      if (cancelled) cleanup();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasVideo || !controlEnabled || !controlReady) {
      unbindControlRef.current?.();
      unbindControlRef.current = null;
      return;
    }
    const overlay = controlOverlayRef.current;
    const video = remoteVideoRef.current;
    const control = controlRef.current;
    if (!overlay || !video || !control) return;

    unbindControlRef.current?.();
    unbindControlRef.current = bindViewerControlOverlay(overlay, video, (data) => control.send(data));
    overlay.focus();

    return () => {
      unbindControlRef.current?.();
      unbindControlRef.current = null;
    };
  }, [hasVideo, controlEnabled, controlReady]);

  useEffect(() => {
    if (!hasVideo || !controlEnabled || controlReady) return;
    setHint("รอช่องควบคุมจาก Host... (Host ต้องเชื่อมต่อ Viewer แล้วรอสักครู่)");
    const t = setTimeout(() => {
      if (!controlRef.current?.isOpen?.()) {
        setHint(
          "ช่องควบคุมยังไม่เปิด — ลองตัดการเชื่อมต่อแล้วเชื่อมต่อใหม่ หรือให้ Host หยุดแชร์แล้วเริ่มใหม่"
        );
      }
    }, 12000);
    return () => clearTimeout(t);
  }, [hasVideo, controlEnabled, controlReady]);

  async function manualPlayVideo() {
    const video = remoteVideoRef.current;
    if (!video) return;
    try {
      await video.play();
      setNeedsPlayTap(false);
      setHasVideo(true);
      setStatus("connected");
    } catch {
      setNeedsPlayTap(true);
    }
  }

  async function connectViewer(roomId) {
    const code = String(roomId || "").trim().toUpperCase();
    if (!code) {
      setError("กรุณาใส่รหัสห้อง");
      return;
    }

    cleanup();
    setError("");
    setHint("");
    setActiveRoom(code);
    setStatus("connecting");
    setHasVideo(false);

    let roomInfo;
    try {
      roomInfo = await fetchRoom(code);
    } catch {
      setError(`ไม่พบห้อง ${code} — ให้ Host สร้างห้องใหม่แล้วลองอีกครั้ง`);
      setStatus("idle");
      setActiveRoom("");
      return;
    }

    const pc = createPeerConnection();
    pcRef.current = pc;
    const iceQueue = createIceQueue(pc);
    controlRef.current = setupControlChannel(pc, "viewer", {
      onOpen: () => {
        setControlReady(true);
        setHint("");
      },
      onClose: () => setControlReady(false),
    });
    let answered = false;
    let sawOffer = false;
    let activeOfferAt = 0;
    const pollSince = roomInfo.latestOfferAt > 0 ? roomInfo.latestOfferAt - 1 : 0;

    unbindVideoRef.current = bindRemoteVideoToPeerConnection(pc, () => remoteVideoRef.current, {
      onVideoReady: () => {
        setHasVideo(true);
        setStatus("connected");
        setHint("");
        setError("");
        const video = remoteVideoRef.current;
        if (video) {
          void video.play().catch(() => setNeedsPlayTap(true));
        }
      },
    });

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void sendSignal(code, "viewer", "ice", ev.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setError(
          "การเชื่อมต่อล้มเหลว — ตรวจว่า Host กด 「เริ่มแชร์หน้าจอ」 แล้ว และทั้งสองเครื่องออนไลน์"
        );
        setStatus("idle");
        setHasVideo(false);
      }
      if (pc.connectionState === "connected") {
        setHint("เชื่อมต่อแล้ว — กำลังรอภาพจาก Host...");
      }
    };

    waitTimerRef.current = setInterval(async () => {
      if (sawOffer) return;
      try {
        const room = await fetchRoom(code);
        if (!room.hasOffer) {
          setHint("รอ Host กด 「เริ่มแชร์หน้าจอ」 ในห้องเดียวกัน...");
        } else {
          setHint("พบสัญญาณจาก Host — กำลังเชื่อมต่อ...");
        }
      } catch {
        /* ignore */
      }
    }, 2500);

    stopPollRef.current = startSignalPoll(
      code,
      "viewer",
      async (msg) => {
        if (msg.type === "offer" && msg.payload) {
          const renegotiate = msg.payload.renegotiate === true;
          if (answered && !renegotiate) return;
          sawOffer = true;
          answered = true;
          activeOfferAt = msg.at;
          setHint(renegotiate ? "กำลังเปิดช่องควบคุม..." : "กำลังเชื่อมต่อวิดีโอ...");
          if (renegotiate) setControlReady(false);
          await pc.setRemoteDescription(toSessionDescription(msg.payload));
          await iceQueue.flush();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal(code, "viewer", "answer", answer);
          return;
        }
        if (msg.type === "hangup") {
          if (!answered || (activeOfferAt > 0 && msg.at < activeOfferAt)) return;
          setError("Host หยุดแชร์แล้ว");
          cleanup();
          setStatus("idle");
          return;
        }
        if (msg.type === "ice" && msg.payload) {
          await iceQueue.add(msg.payload);
        }
      },
      {
        initialSince: pollSince,
        onError: (err) => {
          if (err?.status === 404) {
            setError(`ไม่พบห้อง ${code} — รหัสหมดอายุหรือ Host ปิดแล้ว`);
            cleanup();
            setStatus("idle");
          }
        },
      }
    );
  }

  function disconnect() {
    cleanup();
    setActiveRoom("");
    setStatus("idle");
    setHint("");
  }

  const statusLabel = hasVideo
    ? "เชื่อมต่อแล้ว"
    : status === "connecting"
      ? "กำลังเชื่อมต่อ..."
      : status === "connected"
        ? "รอภาพวิดีโอ..."
        : status;

  const sessionActive = status === "connecting" || status === "connected" || hasVideo;

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h4 mb-0">🖥️ ดูและควบคุมหน้าจอ (Viewer)</h1>
        <Link href="/phone-remote" className="btn btn-sm btn-outline-secondary">
          ← กลับ
        </Link>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-sm-8">
          <input
            className="form-control"
            placeholder="รหัสห้อง 6 ตัว เช่น RT878T"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={sessionActive}
          />
        </div>
        <div className="col-sm-4 d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary flex-grow-1"
            onClick={() => connectViewer(roomInput)}
            disabled={sessionActive}
          >
            เชื่อมต่อ
          </button>
          {activeRoom ? (
            <button type="button" className="btn btn-outline-secondary" onClick={disconnect}>
              ตัดการเชื่อมต่อ
            </button>
          ) : null}
        </div>
      </div>

      {activeRoom ? (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <p className="small text-muted mb-0">
            ห้อง: <code>{activeRoom}</code> — สถานะ: {statusLabel}
          </p>
          {hasVideo ? (
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="control-toggle"
                checked={controlEnabled}
                onChange={(e) => setControlEnabled(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="control-toggle">
                โหมดควบคุม {controlReady ? "(พร้อม)" : "(รอช่องสัญญาณ...)"}
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {hint && !error ? <div className="alert alert-info py-2 small">{hint}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div
        className="bg-dark rounded overflow-hidden"
        style={{ position: "relative", width: "100%", aspectRatio: "16 / 9" }}
      >
        <video
          ref={remoteVideoRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            background: "#000",
            zIndex: 1,
          }}
          playsInline
          autoPlay
          muted
        />
        {hasVideo && controlEnabled ? (
          <>
            <div
              ref={controlOverlayRef}
              tabIndex={0}
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                touchAction: "none",
                cursor: controlReady ? "crosshair" : "not-allowed",
                outline: "none",
                zIndex: 2,
                pointerEvents: controlReady ? "auto" : "none",
              }}
              aria-label="พื้นที่ควบคุมหน้าจอรีโมท"
              aria-disabled={!controlReady}
            />
            {!controlReady ? (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
                style={{ zIndex: 2, pointerEvents: "none" }}
              >
                <span className="badge bg-dark bg-opacity-75 text-wrap text-center">
                  รอช่องควบคุม... แตะได้เมื่อขึ้น 「โหมดควบคุม (พร้อม)」
                </span>
              </div>
            ) : null}
          </>
        ) : null}
        {needsPlayTap ? (
          <button
            type="button"
            className="btn btn-light btn-sm position-absolute top-50 start-50 translate-middle"
            style={{ zIndex: 3 }}
            onClick={manualPlayVideo}
          >
            แตะเพื่อเล่นวิดีโอ
          </button>
        ) : null}
        {sessionActive && !hasVideo && !needsPlayTap ? (
          <div
            className="position-absolute top-50 start-50 translate-middle text-white-50 small text-center px-3"
            style={{ zIndex: 3, pointerEvents: "none" }}
          >
            กำลังรอภาพจาก Host...
          </div>
        ) : null}
      </div>

      {hasVideo && controlEnabled ? (
        <p className="small text-muted mt-2 mb-0">
          {controlReady
            ? "แตะ/ลากบนภาพเพื่อควบคุมหน้าจอ Host — คลิกพื้นที่วิดีโอแล้วพิมพ์เพื่อส่งข้อความ (Android Host ใช้แอป Phone Remote + เปิด Accessibility)"
            : "ยังส่งคำสั่งควบคุมไม่ได้จนกว่า Host จะเปิดช่องควบคุม (ดูสถานะ 「โหมดควบคุม (พร้อม)」)"}
        </p>
      ) : null}

      {!sessionActive ? (
        <div className="small text-muted mt-2 mb-0">
          <p className="mb-1">
            <strong>ขั้นตอน:</strong> Host เปิด <code>/phone-remote/host</code> → สร้างห้อง → กด{" "}
            <strong>เริ่มแชร์หน้าจอ</strong> → Viewer ใส่รหัสห้องเดียวกัน
          </p>
          <p className="mb-0">Host และ Viewer ต้องเปิดเว็บบนเซิร์ฟเวอร์เครื่องเดียวกัน (instance เดียวกัน)</p>
        </div>
      ) : null}
    </main>
  );
}
