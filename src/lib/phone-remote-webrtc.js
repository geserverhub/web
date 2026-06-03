/** STUN + public TURN — needed when phone and PC are on different networks. */
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export async function createRoom() {
  const res = await fetch("/api/phone-remote/rooms", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Cannot create room");
  return data.roomId;
}

export async function fetchRoom(roomId) {
  const q = new URLSearchParams({ roomId: String(roomId || "").toUpperCase() });
  const res = await fetch(`/api/phone-remote/rooms?${q}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Room not found");
  return data;
}

export async function fetchSignals(roomId, role, since) {
  const q = new URLSearchParams({ roomId, role, since: String(since) });
  const res = await fetch(`/api/phone-remote/signal?${q}`);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Signal fetch failed");
    err.status = res.status;
    throw err;
  }
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

export function startSignalPoll(
  roomId,
  role,
  onMessage,
  { onError, intervalMs = 600, initialSince = 0 } = {}
) {
  let since = initialSince;
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const messages = await fetchSignals(roomId, role, since);
      for (const msg of messages) {
        since = Math.max(since, msg.at);
        await onMessage(msg);
      }
    } catch (err) {
      onError?.(err);
    }
    if (!stopped) setTimeout(tick, intervalMs);
  }

  tick();
  return () => {
    stopped = true;
  };
}

/** Queue ICE until remote SDP is applied (avoids lost candidates). */
export function createIceQueue(pc) {
  const pending = [];
  let ready = false;

  async function flush() {
    ready = true;
    const batch = pending.splice(0);
    for (const payload of batch) {
      if (!payload) continue;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload));
      } catch {
        /* duplicate or stale */
      }
    }
  }

  async function add(payload) {
    if (!payload) return;
    if (!ready) {
      pending.push(payload);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(payload));
    } catch {
      /* duplicate or stale */
    }
  }

  return { add, flush };
}

export function createPeerConnection() {
  return new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 4,
  });
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
