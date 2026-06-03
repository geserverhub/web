"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  attachRemoteVideo,
  createIceQueue,
  createPeerConnection,
  fetchRoom,
  sendSignal,
  startSignalPoll,
} from "@/lib/phone-remote-webrtc";

export default function PhoneRemoteViewClient() {
  const searchParams = useSearchParams();
  const initialRoom = (searchParams.get("room") || "").toUpperCase();

  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const stopPollRef = useRef(null);
  const waitTimerRef = useRef(null);

  const [roomInput, setRoomInput] = useState(initialRoom);
  const [activeRoom, setActiveRoom] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const cleanup = useCallback(() => {
    stopPollRef.current?.();
    stopPollRef.current = null;
    if (waitTimerRef.current) {
      clearInterval(waitTimerRef.current);
      waitTimerRef.current = null;
    }
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
    setHint("");
    setActiveRoom(code);
    setStatus("connecting");

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
    let answered = false;
    let sawOffer = false;
    let activeOfferAt = 0;
    const pollSince = roomInfo.latestOfferAt > 0 ? roomInfo.latestOfferAt - 1 : 0;

    pc.ontrack = (ev) => {
      attachRemoteVideo(remoteVideoRef.current, ev.streams[0]);
      setStatus("connected");
      setHint("");
      setError("");
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void sendSignal(code, "viewer", "ice", ev.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("connected");
        setError("");
      }
      if (pc.connectionState === "failed") {
        setError(
          "การเชื่อมต่อล้มเหลว — ตรวจว่า Host กด 「เริ่มแชร์หน้าจอ」 แล้ว และทั้งสองเครื่องออนไลน์"
        );
        setStatus("idle");
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
          if (answered) return;
          sawOffer = true;
          answered = true;
          activeOfferAt = msg.at;
          setHint("กำลังเชื่อมต่อวิดีโอ...");
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
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

  const statusLabel =
    status === "connected"
      ? "เชื่อมต่อแล้ว"
      : status === "connecting"
        ? "กำลังเชื่อมต่อ..."
        : status;

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
            placeholder="รหัสห้อง 6 ตัว เช่น RT878T"
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
          ห้อง: <code>{activeRoom}</code> — สถานะ: {statusLabel}
        </p>
      ) : null}

      {hint && !error ? <div className="alert alert-info py-2 small">{hint}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="ratio ratio-16x9 bg-dark rounded overflow-hidden">
        <video ref={remoteVideoRef} className="w-100 h-100" style={{ objectFit: "contain" }} playsInline autoPlay />
      </div>

      {status !== "connected" ? (
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
