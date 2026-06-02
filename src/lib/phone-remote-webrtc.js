export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export async function createRoom() {
  const res = await fetch("/api/phone-remote/rooms", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Cannot create room");
  return data.roomId;
}

export async function fetchSignals(roomId, role, since) {
  const q = new URLSearchParams({ roomId, role, since: String(since) });
  const res = await fetch(`/api/phone-remote/signal?${q}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signal fetch failed");
  return data.messages || [];
}

export async function sendSignal(roomId, role, type, payload) {
  const res = await fetch("/api/phone-remote/signal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, role, type, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signal send failed");
}

export function startSignalPoll(roomId, role, onMessage) {
  let since = 0;
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const messages = await fetchSignals(roomId, role, since);
      for (const msg of messages) {
        since = Math.max(since, msg.at);
        await onMessage(msg);
      }
    } catch {
      /* retry next tick */
    }
    if (!stopped) setTimeout(tick, 800);
  }

  tick();
  return () => {
    stopped = true;
  };
}

export async function getDisplayStream() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("เบราว์เซอร์นี้ไม่รองรับการแชร์หน้าจอ — ลอง Chrome บน Android หรือ Desktop");
  }
  return navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: 15, max: 30 },
    },
    audio: false,
  });
}

export function attachLocalPreview(videoEl, stream) {
  if (!videoEl) return;
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  void videoEl.play().catch(() => {});
}

export function attachRemoteVideo(videoEl, stream) {
  if (!videoEl) return;
  videoEl.srcObject = stream;
  videoEl.playsInline = true;
  void videoEl.play().catch(() => {});
}
