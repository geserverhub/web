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

/** Strip internal fields before passing to RTCSessionDescription. */
export function toSessionDescription(payload) {
  if (!payload) return null;
  return new RTCSessionDescription({
    type: payload.type,
    sdp: payload.sdp,
  });
}

export function offerPayload(sessionDescription, { renegotiate = false } = {}) {
  return {
    type: sessionDescription.type,
    sdp: sessionDescription.sdp,
    ...(renegotiate ? { renegotiate: true } : {}),
  };
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

const CONTROL_CHANNEL_LABEL = "control";

/** Host creates the channel; viewer receives it via ondatachannel. */
export function setupControlChannel(pc, role, { onMessage, onOpen, onClose } = {}) {
  let channel = null;

  function wire(ch) {
    channel = ch;
    ch.onopen = () => onOpen?.(ch);
    ch.onclose = () => onClose?.(ch);
    ch.onmessage = (ev) => onMessage?.(ev.data, ch);
  }

  if (role === "host") {
    wire(pc.createDataChannel(CONTROL_CHANNEL_LABEL, { ordered: true }));
  } else {
    pc.ondatachannel = (ev) => {
      if (ev.channel?.label === CONTROL_CHANNEL_LABEL) wire(ev.channel);
    };
  }

  return {
    get channel() {
      return channel;
    },
    send(data) {
      if (channel?.readyState === "open") channel.send(data);
    },
    isOpen() {
      return channel?.readyState === "open";
    },
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
  if (!videoEl || !stream) return false;
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.autoplay = true;

  const tryPlay = () => {
    void videoEl.play().catch(() => {});
  };
  tryPlay();
  videoEl.onloadedmetadata = tryPlay;
  return true;
}

/** Pull the first live video track from receivers (Safari / some Android WebViews). */
export function attachVideoFromReceivers(pc, videoEl) {
  if (!pc || !videoEl) return false;
  for (const receiver of pc.getReceivers()) {
    const track = receiver.track;
    if (track?.kind === "video" && track.readyState === "live") {
      return attachRemoteVideo(videoEl, new MediaStream([track]));
    }
  }
  return false;
}

/**
 * Wire remote video to a peer connection with ontrack + ICE/receiver fallbacks.
 * Returns cleanup function.
 */
export function bindRemoteVideoToPeerConnection(pc, getVideoEl, { onVideoReady } = {}) {
  let attached = false;

  function markAttached() {
    if (attached) return;
    attached = true;
    onVideoReady?.();
  }

  function tryAttachStream(stream) {
    const videoEl = getVideoEl();
    if (!stream || !videoEl) return false;
    if (attachRemoteVideo(videoEl, stream)) {
      markAttached();
      return true;
    }
    return false;
  }

  function tryAttachFromEvent(ev) {
    if (ev.streams?.[0]) return tryAttachStream(ev.streams[0]);
    if (ev.track?.kind === "video") return tryAttachStream(new MediaStream([ev.track]));
    return false;
  }

  function tryAttachFromReceivers() {
    if (attached) return true;
    const videoEl = getVideoEl();
    if (!videoEl) return false;
    if (attachVideoFromReceivers(pc, videoEl)) {
      markAttached();
      return true;
    }
    return false;
  }

  const onTrack = (ev) => {
    tryAttachFromEvent(ev);
  };

  const onIceState = () => {
    const state = pc.iceConnectionState;
    if (state === "connected" || state === "completed") {
      tryAttachFromReceivers();
    }
  };

  const onConnState = () => {
    if (pc.connectionState === "connected") {
      tryAttachFromReceivers();
    }
  };

  pc.addEventListener("track", onTrack);
  pc.addEventListener("iceconnectionstatechange", onIceState);
  pc.addEventListener("connectionstatechange", onConnState);

  return () => {
    pc.removeEventListener("track", onTrack);
    pc.removeEventListener("iceconnectionstatechange", onIceState);
    pc.removeEventListener("connectionstatechange", onConnState);
  };
}
