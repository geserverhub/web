"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  attachLocalPreview,
  createIceQueue,
  createPeerConnection,
  createRoom,
  getDisplayStream,
  offerPayload,
  sendSignal,
  setupControlChannel,
  startSignalPoll,
  toSessionDescription,
} from "@/lib/phone-remote-webrtc";
import {
  applyHostControl,
  getNativeControlStatus,
  isCapacitorAndroidHost,
  openNativeControlSettings,
  parseControlMessage,
} from "@/lib/phone-remote-control";

function CopyBtn({ value }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary ms-2"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? "✓ คัดลอกแล้ว" : "คัดลอกรหัส"}
    </button>
  );
}

export default function PhoneRemoteHostPage() {
  const localVideoRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const stopPollRef = useRef(null);
  const controlRef = useRef(null);

  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [viewerConnected, setViewerConnected] = useState(false);
  const [controlReady, setControlReady] = useState(false);
  const [a11yEnabled, setA11yEnabled] = useState(null);

  const cleanup = useCallback(() => {
    stopPollRef.current?.();
    stopPollRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setViewerConnected(false);
    setControlReady(false);
    controlRef.current = null;
  }, []);

  useEffect(() => {
    if (!isCapacitorAndroidHost()) return;
    getNativeControlStatus().then(({ enabled }) => setA11yEnabled(enabled));
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  async function initRoom() {
    setError("");
    const id = await createRoom();
    setRoomId(id);
    setStatus("ready");
  }

  async function startShare() {
    setError("");
    cleanup();
    try {
      let id = roomId;
      if (!id) {
        id = await createRoom();
        setRoomId(id);
      }

      setStatus("sharing");
      const stream = await getDisplayStream();
      streamRef.current = stream;
      attachLocalPreview(localVideoRef.current, stream);

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setStatus("ready");
        cleanup();
      });

      const pc = createPeerConnection();
      pcRef.current = pc;
      const iceQueue = createIceQueue(pc);
      let controlChannelSetup = false;
      let controlRenegotiateInFlight = false;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      function peerIsLinked() {
        const ice = pc.iceConnectionState;
        const conn = pc.connectionState;
        return (
          ice === "connected" ||
          ice === "completed" ||
          conn === "connected"
        );
      }

      async function setupControlChannelRenegotiate() {
        if (controlChannelSetup || controlRenegotiateInFlight || pc.connectionState === "closed") {
          return;
        }
        if (!peerIsLinked()) return;
        controlRenegotiateInFlight = true;
        try {
          controlRef.current = setupControlChannel(pc, "host", {
            onOpen: () => setControlReady(true),
            onClose: () => setControlReady(false),
            onMessage: (raw) => {
              const msg = parseControlMessage(raw);
              if (msg) void applyHostControl(msg);
            },
          });
          const reoffer = await pc.createOffer();
          await pc.setLocalDescription(reoffer);
          await sendSignal(id, "host", "offer", offerPayload(reoffer, { renegotiate: true }));
          controlChannelSetup = true;
        } catch {
          controlChannelSetup = false;
          setTimeout(() => void setupControlChannelRenegotiate(), 2000);
        } finally {
          controlRenegotiateInFlight = false;
        }
      }

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          void sendSignal(id, "host", "ice", ev.candidate.toJSON());
        }
      };

      const tryOpenControl = () => {
        if (peerIsLinked()) {
          setViewerConnected(true);
          void setupControlChannelRenegotiate();
        }
      };

      pc.onconnectionstatechange = () => {
        tryOpenControl();
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setViewerConnected(false);
          setControlReady(false);
        }
      };

      pc.oniceconnectionstatechange = () => {
        tryOpenControl();
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          setViewerConnected(false);
          setControlReady(false);
        }
      };

      stopPollRef.current = startSignalPoll(id, "host", async (msg) => {
        if (msg.type === "answer" && msg.payload) {
          await pc.setRemoteDescription(toSessionDescription(msg.payload));
          await iceQueue.flush();
          tryOpenControl();
        }
        if (msg.type === "ice" && msg.payload) {
          await iceQueue.add(msg.payload);
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(id, "host", "offer", offerPayload(offer));
    } catch (err) {
      setError(err.message || "ไม่สามารถแชร์หน้าจอได้");
      setStatus(roomId ? "ready" : "idle");
      cleanup();
    }
  }

  async function stopShare() {
    if (roomId) await sendSignal(roomId, "host", "hangup", null).catch(() => {});
    cleanup();
    setStatus("ready");
  }

  const viewUrl =
    typeof window !== "undefined" && roomId
      ? `${window.location.origin}/phone-remote/view?room=${roomId}`
      : "";

  return (
    <main className="container py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h4 mb-0">📱 แชร์หน้าจอ (Host)</h1>
        <Link href="/phone-remote" className="btn btn-sm btn-outline-secondary">
          ← กลับ
        </Link>
      </div>

      {!roomId ? (
        <button type="button" className="btn btn-primary" onClick={initRoom}>
          สร้างห้องใหม่
        </button>
      ) : (
        <div className="alert alert-secondary py-2">
          <strong>รหัสห้อง:</strong> <code className="fs-5">{roomId}</code>
          <CopyBtn value={roomId} />
          {viewUrl ? (
            <div className="mt-2 small">
              ลิงก์ให้ Viewer:{" "}
              <a href={viewUrl} target="_blank" rel="noreferrer">
                {viewUrl}
              </a>
              <CopyBtn value={viewUrl} />
            </div>
          ) : null}
        </div>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          type="button"
          className="btn btn-success"
          onClick={startShare}
          disabled={status === "sharing"}
        >
          {status === "sharing" ? "กำลังแชร์..." : "เริ่มแชร์หน้าจอ"}
        </button>
        {status === "sharing" ? (
          <button type="button" className="btn btn-outline-danger" onClick={stopShare}>
            หยุดแชร์
          </button>
        ) : null}
      </div>

      {viewerConnected ? (
        <div className="alert alert-success py-2 small">
          Viewer เชื่อมต่อแล้ว — กำลังส่งภาพ
          {controlReady ? " · รับการควบคุมจาก Viewer ได้" : " · รอช่องควบคุม..."}
        </div>
      ) : status === "sharing" ? (
        <div className="alert alert-warning py-2 small">รอ Viewer เข้ารหัสห้อง {roomId}</div>
      ) : null}

      {isCapacitorAndroidHost() && status === "sharing" ? (
        <div className={`alert py-2 small ${a11yEnabled ? "alert-info" : "alert-warning"}`}>
          {a11yEnabled ? (
            <>
              <strong>ควบคุมหน้าจอ Android:</strong> เปิดใช้งานแล้ว — Viewer แตะ/พิมพ์บนหน้าจอที่ดูได้
            </>
          ) : (
            <>
              <strong>ควบคุมหน้าจอ Android:</strong> เปิดสิทธิ์ Accessibility เพื่อให้ Viewer ควบคุมแอปบนโทรศัพท์ได้{" "}
              <button
                type="button"
                className="btn btn-sm btn-outline-dark ms-1"
                onClick={async () => {
                  await openNativeControlSettings();
                  setTimeout(async () => {
                    const { enabled } = await getNativeControlStatus();
                    setA11yEnabled(enabled);
                  }, 1500);
                }}
              >
                เปิดการตั้งค่า
              </button>
            </>
          )}
        </div>
      ) : status === "sharing" ? (
        <div className="alert alert-info py-2 small">
          <strong>โหมดควบคุม:</strong> Viewer ส่งคำสั่งแตะ/พิมพ์มาที่ Host — บน Desktop ใช้ได้ภายในแท็บเบราว์เซอร์ที่แชร์
          บน Android ติดตั้งแอป <strong>Phone Remote</strong> (`phoneremote.myapp`) แล้วเปิด Accessibility
        </div>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="ratio ratio-16x9 bg-dark rounded overflow-hidden">
        <video ref={localVideoRef} className="w-100 h-100" style={{ objectFit: "contain" }} playsInline muted />
      </div>
      <p className="small text-muted mt-2 mb-0">ตัวอย่างหน้าจอที่กำลังแชร์ (Host preview)</p>
    </main>
  );
}
