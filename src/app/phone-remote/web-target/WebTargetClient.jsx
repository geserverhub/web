"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { applyWebControl, parseControlMessage } from "@/lib/phone-remote-control";
import { webControlChannelName } from "@/lib/phone-remote-web-bridge";

export default function WebTargetClient() {
  const searchParams = useSearchParams();
  const roomId = (searchParams.get("room") || "").toUpperCase();
  const embedPath = searchParams.get("embed") || "";

  const iframeRef = useRef(null);
  const [linked, setLinked] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const getControlRoot = useCallback(() => {
    const iframe = iframeRef.current;
    if (embedPath && iframe?.contentDocument) {
      return iframe.contentDocument;
    }
    return document;
  }, [embedPath]);

  useEffect(() => {
    if (!roomId) return;

    let channel;
    try {
      channel = new BroadcastChannel(webControlChannelName(roomId));
    } catch {
      return;
    }

    const onMessage = (ev) => {
      const data = ev.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "ping") {
        setLinked(true);
        try {
          channel.postMessage({ type: "pong", at: Date.now() });
        } catch {
          /* ignore */
        }
        return;
      }

      if (data.type === "host-bye") {
        setLinked(false);
        return;
      }

      if (data.type === "control" && data.msg) {
        const msg = typeof data.msg === "string" ? parseControlMessage(data.msg) : data.msg;
        if (!msg) return;
        const root = getControlRoot();
        applyWebControl(msg, { rootDocument: root });
        setLastAction(msg.t);
        setLinked(true);
      }
    };

    channel.onmessage = onMessage;
    channel.postMessage({ type: "pong", at: Date.now() });

    return () => {
      try {
        channel.postMessage({ type: "bye" });
        channel.close();
      } catch {
        /* ignore */
      }
    };
  }, [roomId, getControlRoot]);

  const embedSrc =
    embedPath && embedPath.startsWith("/") && !embedPath.startsWith("//") ? embedPath : "";

  if (!roomId) {
    return (
      <main className="container py-4">
        <div className="alert alert-warning">ไม่พบรหัสห้อง — เปิดจากหน้า Host แล้วกด 「เปิดแท็บควบคุมเว็บ」</div>
        <Link href="/phone-remote/host" className="btn btn-outline-secondary btn-sm">
          ไปหน้า Host
        </Link>
      </main>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        background: embedSrc ? "#fff" : "#0f172a",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          zIndex: 99999,
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 8,
          background: linked ? "rgba(22,163,74,0.92)" : "rgba(234,179,8,0.92)",
          color: "#fff",
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        ควบคุมเว็บ · ห้อง {roomId}
        {linked ? " · เชื่อม Host แล้ว" : " · รอ Host"}
        {lastAction ? ` · ${lastAction}` : ""}
      </div>

      {embedSrc ? (
        <iframe
          ref={iframeRef}
          title="หน้าเว็บที่ควบคุม"
          src={embedSrc}
          style={{ flex: 1, width: "100%", border: "none", minHeight: "100vh" }}
          onLoad={() => setLinked(true)}
        />
      ) : (
        <main
          className="container py-5 text-center"
          style={{ color: "#e2e8f0", maxWidth: 560, margin: "0 auto" }}
        >
          <h1 className="h4 mb-3">แท็บรับการควบคุมจาก Viewer</h1>
          <p className="small mb-4">
            เมื่อแชร์หน้าจอ ให้เลือก <strong>แท็บนี้</strong> ในหน้าต่างแชร์ของเบราว์เซอร์
            Viewer จะแตะ/เลื่อน/พิมพ์บนหน้านี้ได้
          </p>
          <ol className="text-start small text-white-50 mb-4">
            <li>เปิดเว็บที่ต้องการให้ควบคุมในแท็บอื่น หรือใช้ลิงก์ฝังด้านล่าง</li>
            <li>Host กด 「เริ่มแชร์หน้าจอ」 แล้วเลือก <strong>แท็บนี้</strong></li>
            <li>Viewer รอ 「โหมดควบคุม (พร้อม)」 แล้วแตะบนภาพ</li>
          </ol>
          <p className="small text-white-50 mb-0">
            ฝังหน้าในระบบ (ทดสอบ): เพิ่ม <code>?embed=/phone-remote</code> ใน URL
          </p>
        </main>
      )}
    </div>
  );
}
