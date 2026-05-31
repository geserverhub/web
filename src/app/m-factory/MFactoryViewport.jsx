"use client";

import { useEffect } from "react";

/** iOS/Android: pinch zoom in/out; minimum-scale allows zoom out after input focus. */
const VIEWPORT =
  "width=device-width, initial-scale=1, minimum-scale=0.25, maximum-scale=5, user-scalable=yes";

function applyViewport() {
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    document.head.prepend(meta);
  }
  if (meta.getAttribute("content") !== VIEWPORT) {
    meta.setAttribute("content", VIEWPORT);
  }
}

export default function MFactoryViewport() {
  useEffect(() => {
    applyViewport();
    window.addEventListener("focusin", applyViewport, { passive: true });
    window.addEventListener("focusout", applyViewport, { passive: true });
    window.addEventListener("pageshow", applyViewport, { passive: true });
    return () => {
      window.removeEventListener("focusin", applyViewport);
      window.removeEventListener("focusout", applyViewport);
      window.removeEventListener("pageshow", applyViewport);
    };
  }, []);

  return null;
}
