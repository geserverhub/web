/** @typedef {import('./phone-remote-control').ControlMsg} ControlMsg */

export function webControlChannelName(roomId) {
  return `phone-remote-web-${String(roomId || "").toUpperCase()}`;
}

/**
 * Forward viewer control messages to a browser tab running /phone-remote/web-target.
 * Same-origin tabs only (BroadcastChannel).
 */
export function createWebControlBridge(roomId, { onTargetReady, onTargetLost } = {}) {
  if (typeof window === "undefined" || !roomId) {
    return {
      forward() {
        return false;
      },
      hasTarget: () => false,
      close() {},
      ping() {},
    };
  }

  const channelName = webControlChannelName(roomId);
  let channel;
  try {
    channel = new BroadcastChannel(channelName);
  } catch {
    return {
      forward() {
        return false;
      },
      hasTarget: () => false,
      close() {},
      ping() {},
    };
  }

  let targetAlive = false;
  let pingTimer = null;
  let lastPongAt = 0;

  channel.onmessage = (ev) => {
    const data = ev.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "pong") {
      const wasAlive = targetAlive;
      targetAlive = true;
      lastPongAt = Date.now();
      if (!wasAlive) onTargetReady?.();
    }
    if (data.type === "bye") {
      targetAlive = false;
      onTargetLost?.();
    }
  };

  function startPing() {
    stopPing();
    pingTimer = setInterval(() => {
      try {
        channel.postMessage({ type: "ping", at: Date.now() });
      } catch {
        /* ignore */
      }
      if (targetAlive && lastPongAt > 0 && Date.now() - lastPongAt > 8000) {
        targetAlive = false;
        onTargetLost?.();
      }
    }, 2000);
    try {
      channel.postMessage({ type: "ping", at: Date.now() });
    } catch {
      /* ignore */
    }
  }

  function stopPing() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  startPing();

  return {
    forward(msg) {
      if (!msg) return false;
      try {
        channel.postMessage({ type: "control", msg });
        return true;
      } catch {
        return false;
      }
    },
    hasTarget() {
      return targetAlive;
    },
    close() {
      stopPing();
      try {
        channel.postMessage({ type: "host-bye" });
        channel.close();
      } catch {
        /* ignore */
      }
    },
    ping: startPing,
  };
}

export function openWebControlTarget(roomId, { embedPath } = {}) {
  if (typeof window === "undefined" || !roomId) return null;
  const q = new URLSearchParams({ room: String(roomId).toUpperCase() });
  if (embedPath) q.set("embed", embedPath);
  const url = `${window.location.origin}/phone-remote/web-target?${q}`;
  const name = `phone-remote-target-${q.get("room")}`;
  return window.open(url, name, "noopener,noreferrer");
}
