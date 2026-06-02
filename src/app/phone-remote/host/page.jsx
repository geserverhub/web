"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ICE_SERVERS,
  attachLocalPreview,
  createRoom,
  getDisplayStream,
  sendSignal,
  startSignalPoll,
} from "@/lib/phone-remote-webrtc";

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

  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [viewerConnected, setViewerConnected] = useState(false);

  const cleanup = useCallback(() => {
    stopPollRef.current?.();
    stopPollRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setViewerConnected(false);
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

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          void sendSignal(id, "host", "ice", ev.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setViewerConnected(true);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setViewerConnected(false);
        }
      };

      stopPollRef.current = startSignalPoll(id, "host", async (msg) => {
        if (msg.type === "answer" && msg.payload) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        }
        if (msg.type === "ice" && msg.payload) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
          } catch {
            /* ignore duplicate */
          }
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(id, "host", "offer", offer);
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
        <div className="alert alert-success py-2 small">Viewer เชื่อมต่อแล้ว — กำลังส่งภาพ</div>
      ) : status === "sharing" ? (
        <div className="alert alert-warning py-2 small">รอ Viewer เข้ารหัสห้อง {roomId}</div>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="ratio ratio-16x9 bg-dark rounded overflow-hidden">
        <video ref={localVideoRef} className="w-100 h-100" style={{ objectFit: "contain" }} playsInline muted />
      </div>
      <p className="small text-muted mt-2 mb-0">ตัวอย่างหน้าจอที่กำลังแชร์ (Host preview)</p>
    </main>
  );
}
