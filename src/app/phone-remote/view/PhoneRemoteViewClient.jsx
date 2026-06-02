"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ICE_SERVERS,
  attachRemoteVideo,
  sendSignal,
  startSignalPoll,
} from "@/lib/phone-remote-webrtc";

export default function PhoneRemoteViewClient() {
  const searchParams = useSearchParams();
  const initialRoom = (searchParams.get("room") || "").toUpperCase();

  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const stopPollRef = useRef(null);

  const [roomInput, setRoomInput] = useState(initialRoom);
  const [activeRoom, setActiveRoom] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const cleanup = useCallback(() => {
    stopPollRef.current?.();
    stopPollRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  useEffect(() => {
    if (initialRoom) connectViewer(initialRoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectViewer(roomId) {
    const code = String(roomId || "").trim().toUpperCase();
    if (!code) {
      setError("กรุณาใส่รหัสห้อง");
      return;
    }

    cleanup();
    setError("");
    setActiveRoom(code);
    setStatus("connecting");

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ontrack = (ev) => {
      attachRemoteVideo(remoteVideoRef.current, ev.streams[0]);
      setStatus("connected");
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void sendSignal(code, "viewer", "ice", ev.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setError("การเชื่อมต่อล้มเหลว — ลองใหม่");
        setStatus("idle");
      }
      if (pc.connectionState === "disconnected") {
        setStatus("idle");
      }
    };

    let answered = false;

    stopPollRef.current = startSignalPoll(code, "viewer", async (msg) => {
      if (msg.type === "hangup") {
        setError("Host หยุดแชร์แล้ว");
        cleanup();
        setStatus("idle");
        return;
      }
      if (msg.type === "offer" && msg.payload && !answered) {
        answered = true;
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(code, "viewer", "answer", answer);
      }
      if (msg.type === "ice" && msg.payload) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
        } catch {
          /* ignore */
        }
      }
    });
  }

  function disconnect() {
    cleanup();
    setActiveRoom("");
    setStatus("idle");
  }

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h4 mb-0">🖥️ ดูหน้าจอ (Viewer)</h1>
        <Link href="/phone-remote" className="btn btn-sm btn-outline-secondary">
          ← กลับ
        </Link>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-sm-8">
          <input
            className="form-control"
            placeholder="รหัสห้อง 6 ตัว เช่น ABC123"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={status === "connecting" || status === "connected"}
          />
        </div>
        <div className="col-sm-4 d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary flex-grow-1"
            onClick={() => connectViewer(roomInput)}
            disabled={status === "connecting" || status === "connected"}
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
        <p className="small text-muted">
          ห้อง: <code>{activeRoom}</code> — สถานะ:{" "}
          {status === "connected" ? "เชื่อมต่อแล้ว" : status === "connecting" ? "กำลังเชื่อมต่อ..." : status}
        </p>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="ratio ratio-16x9 bg-dark rounded overflow-hidden">
        <video ref={remoteVideoRef} className="w-100 h-100" style={{ objectFit: "contain" }} playsInline autoPlay />
      </div>

      {status !== "connected" ? (
        <p className="small text-muted mt-2 mb-0">
          รอ Host เริ่มแชร์หน้าจอในห้องเดียวกัน — เปิดได้ทั้งเว็บและมือถือ
        </p>
      ) : null}
    </main>
  );
}
