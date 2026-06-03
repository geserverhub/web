/** @typedef {{ x: number, y: number }} NormPoint */
/** @typedef {{ t: string, x?: number, y?: number, p?: number, dy?: number, k?: string, v?: string }} ControlMsg */

const MOVE_THROTTLE_MS = 32;

/** Visible video frame inside a letterboxed <video> element. */
export function getVideoContentRect(videoEl) {
  if (!videoEl) return null;
  const rect = videoEl.getBoundingClientRect();
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh) return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

  const elementAspect = rect.width / rect.height;
  const videoAspect = vw / vh;
  let contentW;
  let contentH;
  let offsetX;
  let offsetY;

  if (videoAspect > elementAspect) {
    contentW = rect.width;
    contentH = rect.width / videoAspect;
    offsetX = 0;
    offsetY = (rect.height - contentH) / 2;
  } else {
    contentH = rect.height;
    contentW = rect.height * videoAspect;
    offsetX = (rect.width - contentW) / 2;
    offsetY = 0;
  }

  return {
    left: rect.left + offsetX,
    top: rect.top + offsetY,
    width: contentW,
    height: contentH,
  };
}

/** Map pointer position on the viewer overlay to normalized coords (0–1) on the remote screen. */
export function clientToNormalized(videoEl, clientX, clientY) {
  const content = getVideoContentRect(videoEl);
  if (!content || content.width <= 0 || content.height <= 0) return null;
  const x = (clientX - content.left) / content.width;
  const y = (clientY - content.top) / content.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

export function parseControlMessage(raw) {
  if (typeof raw !== "string") return null;
  try {
    const msg = JSON.parse(raw);
    if (!msg || typeof msg.t !== "string") return null;
    return msg;
  } catch {
    return null;
  }
}

export function serializeControlMessage(msg) {
  return JSON.stringify(msg);
}

function getCapacitorControlPlugin() {
  if (typeof window === "undefined") return null;
  return window.Capacitor?.Plugins?.PhoneRemoteControl ?? null;
}

export function isCapacitorAndroidHost() {
  return isPhoneRemoteAndroidApp();
}

/** True when running inside the standalone Phone Remote Android app (not Momoge or browser). */
export function isPhoneRemoteAndroidApp() {
  if (typeof window === "undefined") return false;
  if (window.Capacitor?.getPlatform?.() !== "android") return false;
  return Boolean(window.Capacitor?.Plugins?.PhoneRemoteControl);
}

export async function getNativeControlStatus() {
  const plugin = getCapacitorControlPlugin();
  if (!plugin?.isEnabled) return { available: false, enabled: false };
  try {
    const result = await plugin.isEnabled();
    return { available: true, enabled: Boolean(result?.enabled) };
  } catch {
    return { available: true, enabled: false };
  }
}

export async function openNativeControlSettings() {
  const plugin = getCapacitorControlPlugin();
  if (!plugin?.openAccessibilitySettings) return false;
  await plugin.openAccessibilitySettings();
  return true;
}

function dispatchDomPointer(target, type, x, y, pointerId = 1) {
  const opts = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    pointerId,
    pointerType: "touch",
    isPrimary: true,
    buttons: type === "up" ? 0 : 1,
  };
  target.dispatchEvent(new PointerEvent(`pointer${type}`, opts));
  if (type === "down") {
    target.dispatchEvent(new MouseEvent("mousedown", { ...opts, button: 0 }));
  }
  if (type === "up") {
    target.dispatchEvent(new MouseEvent("mouseup", { ...opts, button: 0 }));
    target.dispatchEvent(new MouseEvent("click", { ...opts, button: 0 }));
  }
}

function dispatchDomKey(type, key) {
  const target = document.activeElement || document.body;
  const code = key.length === 1 ? `Key${key.toUpperCase()}` : key;
  target.dispatchEvent(
    new KeyboardEvent(type === "down" ? "keydown" : "keyup", {
      bubbles: true,
      cancelable: true,
      key,
      code,
    })
  );
  if (type === "down" && key.length === 1) {
    target.dispatchEvent(
      new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data: key })
    );
  }
}

/** Apply control inside the host browser tab (limited — not OS-wide). */
export function applyWebControl(msg) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const px = Math.round((msg.x ?? 0.5) * w);
  const py = Math.round((msg.y ?? 0.5) * h);
  const target = document.elementFromPoint(px, py) || document.body;

  switch (msg.t) {
    case "tap":
      dispatchDomPointer(target, "down", px, py);
      dispatchDomPointer(target, "up", px, py);
      break;
    case "down":
      dispatchDomPointer(target, "down", px, py, msg.p ?? 1);
      break;
    case "move":
      dispatchDomPointer(target, "move", px, py, msg.p ?? 1);
      break;
    case "up":
      dispatchDomPointer(target, "up", px, py, msg.p ?? 1);
      break;
    case "scroll": {
      const dy = Number(msg.dy) || 0;
      target.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          clientX: px,
          clientY: py,
          deltaY: dy * 120,
        })
      );
      break;
    }
    case "key":
      if (msg.k) dispatchDomKey("down", msg.k);
      break;
    case "text":
      if (msg.v && target instanceof HTMLElement) {
        if (target.isContentEditable) {
          target.textContent = (target.textContent || "") + msg.v;
        } else if ("value" in target) {
          target.value = `${target.value || ""}${msg.v}`;
          target.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      break;
    default:
      break;
  }
}

/** Apply control on the host — native Android (full screen) or web fallback. */
export async function applyHostControl(msg) {
  const plugin = getCapacitorControlPlugin();
  if (plugin?.dispatch) {
    try {
      await plugin.dispatch({ action: msg });
      return "native";
    } catch {
      /* fall through */
    }
  }
  applyWebControl(msg);
  return "web";
}

/** Wire viewer overlay → data channel sender. */
export function bindViewerControlOverlay(containerEl, videoEl, sendFn) {
  if (!containerEl || !videoEl || !sendFn) return () => {};

  let activePointer = null;
  let lastMoveAt = 0;

  function send(msg) {
    sendFn(serializeControlMessage(msg));
  }

  function onPointerDown(ev) {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    ev.preventDefault();
    containerEl.setPointerCapture(ev.pointerId);
    const norm = clientToNormalized(videoEl, ev.clientX, ev.clientY);
    if (!norm) return;
    activePointer = { id: ev.pointerId, ...norm };
    send({ t: "down", x: norm.x, y: norm.y, p: ev.pointerId });
  }

  function onPointerMove(ev) {
    if (activePointer?.id !== ev.pointerId) return;
    ev.preventDefault();
    const now = Date.now();
    if (now - lastMoveAt < MOVE_THROTTLE_MS) return;
    lastMoveAt = now;
    const norm = clientToNormalized(videoEl, ev.clientX, ev.clientY);
    if (!norm) return;
    activePointer = { id: ev.pointerId, ...norm };
    send({ t: "move", x: norm.x, y: norm.y, p: ev.pointerId });
  }

  function onPointerUp(ev) {
    if (activePointer?.id !== ev.pointerId) return;
    ev.preventDefault();
    const norm = clientToNormalized(videoEl, ev.clientX, ev.clientY) || activePointer;
    send({ t: "up", x: norm.x, y: norm.y, p: ev.pointerId });
    if (
      Math.hypot(norm.x - activePointer.x, norm.y - activePointer.y) < 0.02
    ) {
      send({ t: "tap", x: norm.x, y: norm.y });
    }
    activePointer = null;
    try {
      containerEl.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onWheel(ev) {
    ev.preventDefault();
    const norm = clientToNormalized(videoEl, ev.clientX, ev.clientY);
    if (!norm) return;
    send({ t: "scroll", x: norm.x, y: norm.y, dy: ev.deltaY > 0 ? 1 : -1 });
  }

  function onKeyDown(ev) {
    if (ev.key === "Tab" || ev.key === "Escape") return;
    ev.preventDefault();
    if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      send({ t: "text", v: ev.key });
      return;
    }
    send({ t: "key", k: ev.key });
  }

  containerEl.addEventListener("pointerdown", onPointerDown);
  containerEl.addEventListener("pointermove", onPointerMove);
  containerEl.addEventListener("pointerup", onPointerUp);
  containerEl.addEventListener("pointercancel", onPointerUp);
  containerEl.addEventListener("wheel", onWheel, { passive: false });
  containerEl.addEventListener("keydown", onKeyDown);

  return () => {
    containerEl.removeEventListener("pointerdown", onPointerDown);
    containerEl.removeEventListener("pointermove", onPointerMove);
    containerEl.removeEventListener("pointerup", onPointerUp);
    containerEl.removeEventListener("pointercancel", onPointerUp);
    containerEl.removeEventListener("wheel", onWheel);
    containerEl.removeEventListener("keydown", onKeyDown);
  };
}
